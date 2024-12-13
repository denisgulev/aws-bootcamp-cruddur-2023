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

    # when you want to commit data to the database
    def query_commit(self, sql):
        try:
            logger.info("Attempting to acquire a database connection...")
            with self.pool.connection() as conn:  # Acquire a connection from the pool
                logger.info("Database connection acquired successfully.")
                with conn.cursor() as cur:
                    logger.info(f"Executing query... {sql}")
                    cur.execute(sql)
                    conn.commit()

                    logger.info("Query executed successfully.")
        except Exception as e:
            self.print_sql_err(e)

    # when you want to retrieve an array of json object from the database
    def query_array(self, sql):
        try:
            logger.info("Attempting to acquire a database connection...")
            with self.pool.connection() as conn:  # Acquire a connection from the pool
                logger.info("Database connection acquired successfully.")
                with conn.cursor() as cur:
                    logger.info(f"Executing query... {sql}")
                    wrapped_query = self.query_wrap_array(sql)
                    cur.execute(wrapped_query)
                    json = cur.fetchone()  # Fetch a single row from the table

                    logger.info("Query executed successfully. Returning results.")
                    if json:
                        return json[0]
        except Exception as e:
            self.print_sql_err(e)

    # when you want to retrieve a json object from the database
    def query_object(self, sql):
        try:
            logger.info("Attempting to acquire a database connection...")
            with self.pool.connection() as conn:  # Acquire a connection from the pool
                logger.info("Database connection acquired successfully.")
                with conn.cursor() as cur:
                    logger.info(f"Executing query... {sql}")
                    wrapped_query = self.query_wrap_object(sql)
                    cur.execute(wrapped_query)
                    json = cur.fetchone()  # Fetch a single row from the table

                    logger.info("Query executed successfully. Returning results.")
                    if json:
                        return json[0]
        except Exception as e:
            self.print_sql_err(e)

    def print_sql_err(err):
        err_type, err_obj, traceback = sys.exec_info()

        line_num = traceback.tb_lineno

        print("\npsycopg ERROR:", err, "on line number:", line_num)
        print("\npsycopg traceback:", traceback, "  type:", err_type)

        print("\nextensions.Diagnostics:", err.diag)

        print("pgerror:", err.pgerror)
        print("pgcode:", err.pgcode, "\n")

    def query_wrap_object(template):
        return f'''
          (SELECT COALESCE(row_to_json(object_row),'{{}}'::json) FROM (
          {template}
          ) object_row);
        '''

    def query_wrap_array(template):
        return f'''
          (SELECT COALESCE(array_to_json(array_agg(row_to_json(array_row))),'[]'::json) FROM (
          {template}
          ) array_row);
        '''

db = Db()