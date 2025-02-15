from datetime import datetime, timedelta, timezone
from opentelemetry import trace

from lib.db import db

# Creates a tracer from the global tracer provider
tracer = trace.get_tracer("home.activities")

class HomeActivities:
  def run(cognito_user_id=None):

    with tracer.start_as_current_span("home-activities-mock-data"):
      span = trace.get_current_span()
      now = datetime.now(timezone.utc).astimezone()
      span.set_attribute("app.now", now.isoformat())

      sql = """
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
      """

      return db.query_array(sql)
