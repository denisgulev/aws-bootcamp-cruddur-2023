from psycopg_pool import ConnectionPool
import os, sys
import logging

logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to capture all levels of logs
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler()]  # Ensures logs are directed to the console
)

logger = logging.getLogger(__name__)

class Db:
    def __init__(self):
        self.pool = None
        self.init_pool()

    def init_pool(self):
        connection_url = os.getenv("CONNECTION_URL")
        self.pool = ConnectionPool(connection_url)

    def print_sql(self,title,sql):
        cyan = '\033[96m'
        no_color = '\033[0m'
        logger.info(f'{cyan} SQL STATEMENT-[{title}]------{no_color}')
        logger.info(sql)

    def print_params(self,params):
        blue = '\033[94m'
        no_color = '\033[0m'
        logger.info(f'{blue} SQL Params:{no_color}')
        for key, value in params.items():
            logger.info(key, ":", value)

    # when you want to commit data to the database, returning the uuid
    def query_commit_with_returning_id(self, sql, params=None):
        if params is None:
            params = {}
        self.print_sql('commit with returning',sql)
        self.print_params(params)
        try:
            with self.pool.connection() as conn:  # Acquire a connection from the pool
                cur = conn.cursor()
                cur.execute(sql, params)
                last_id = cur.fetchone()[0]
                conn.commit()

                return last_id
        except Exception as e:
            self.print_sql_err(e)

    # when you want to commit data to the database
    def query_commit(self, sql):
        self.print_sql('commit',sql)
        try:
            with self.pool.connection() as conn:  # Acquire a connection from the pool
                with conn.cursor() as cur:
                    cur.execute(sql)
                    conn.commit()

        except Exception as e:
            self.print_sql_err(e)

    # when you want to retrieve an array of json object from the database
    def query_array(self, sql):
        self.print_sql('query array',sql)
        try:
            with self.pool.connection() as conn:  # Acquire a connection from the pool
                with conn.cursor() as cur:
                    wrapped_query = self.query_wrap_array(sql)
                    logger.debug(f"wrapped_query: {wrapped_query}")
                    cur.execute(wrapped_query)
                    logger.debug("after cur.execute")
                    json = cur.fetchone()  # Fetch a single row from the table
                    logger.debug("after cur.fetchone()")
                    logger.debug(f"json: {json}")

                    # Handle cases where fetchone() returns None
                    if json and json[0] is not None:
                        logger.debug("before return json[0]")
                        return json[0]
                    else:
                        logger.debug("before return []")
                        return []  # Default to an empty array if no data
        except Exception as e:
            logger.debug("before print_sql_err")
            self.print_sql_err(e)

    # when you want to retrieve a json object from the database
    def query_object_json(self, sql, params=None):
        try:
            if params is None:
                params = {}

            self.print_sql('json',sql)
            self.print_params(params)
            wrapped_sql = self.query_wrap_object(sql)

            with self.pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(wrapped_sql,params)
                    json = cur.fetchone()
                    if json is None:
                        "{}"
                    else:
                        return json[0]
        except Exception as e:
            self.print_sql_err(e)

    def print_sql_err(self, err):
        err_type, err_obj, traceback = sys.exc_info()

        line_num = traceback.tb_lineno

        print("\npsycopg ERROR:", err, "on line number:", line_num)
        # print("\npsycopg traceback:", traceback, "  type:", err_type)
        #
        # print("\nextensions.Diagnostics:", err.diag)
        #
        # print("pgerror:", err.pgerror)
        # print("pgcode:", err.pgcode, "\n")

    def query_wrap_object(self, template):
        return f'''
          (SELECT COALESCE(row_to_json(object_row),'{{}}'::json) FROM (
          {template}
          ) as object_row);
        '''

    def query_wrap_array(self, template):
        return f'''
          (SELECT COALESCE(array_to_json(array_agg(row_to_json(array_row))),'[]'::json) FROM (
          {template}
          ) as array_row);
        '''

db = Db()