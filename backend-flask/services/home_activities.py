from datetime import datetime, timedelta, timezone
from opentelemetry import trace
import logging

from lib.db import pool, query_wrap_array

# Creates a tracer from the global tracer provider
tracer = trace.get_tracer("home.activities")

logging.basicConfig(
  level=logging.DEBUG,  # Set to DEBUG to capture all levels of logs
  format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
  handlers=[logging.StreamHandler()]  # Ensures logs are directed to the console
)

logger = logging.getLogger(__name__)

class HomeActivities:
  def run(cognito_user_id=None):

    with tracer.start_as_current_span("home-activities-mock-data"):
      span = trace.get_current_span()
      now = datetime.now(timezone.utc).astimezone()
      span.set_attribute("app.now", now.isoformat())

      sql = query_wrap_array("""
        SELECT
          activities.uuid,
          users.display_name,
          users.handle,
          activities.message,
          activities.replies_count,
          activities.reposts_count,
          activities.likes_count,
          activities.reply_to_activity_uuid,
          activities.expires_at,
          activities.created_at
        FROM public.activities
        LEFT JOIN public.users ON users.uuid = activities.user_uuid
        ORDER BY activities.created_at DESC
      """)

      try:
        logger.info("Attempting to acquire a database connection...")
        with pool.connection() as conn:  # Acquire a connection from the pool
          logger.info("Database connection acquired successfully.")
          with conn.cursor() as cur:
            logger.info(f"Executing query... {sql}")
            cur.execute(sql)
            json = cur.fetchone()  # Fetch a single row from the table

            logger.info("Query executed successfully. Returning results.")
            if json:
              return json[0]
      except Exception as e:
        logger.error("An error occurred while fetching data.", exc_info=True)
      return None