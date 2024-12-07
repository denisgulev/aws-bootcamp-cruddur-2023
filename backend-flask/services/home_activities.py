from datetime import datetime, timedelta, timezone
from opentelemetry import trace

# Creates a tracer from the global tracer provider
tracer = trace.get_tracer("home.activities")

class HomeActivities:
  def run(cognito_user_id=None):
    with tracer.start_as_current_span("home-activities-mock-data"):
      span = trace.get_current_span()
      now = datetime.now(timezone.utc).astimezone()
      span.set_attribute("app.now", now.isoformat())
      results = [{
        'uuid': '68f126b0-1ceb-4a33-88be-d90fa7109eee',
        'handle':  'Andrew Brown',
        'message': 'Cloud is fun!',
        'created_at': (now - timedelta(days=2)).isoformat(),
        'expires_at': (now + timedelta(days=5)).isoformat(),
        'likes_count': 5,
        'replies_count': 1,
        'reposts_count': 0,
        'replies': [{
          'uuid': '26e12864-1c26-5c3a-9658-97a10f8fea67',
          'reply_to_activity_uuid': '68f126b0-1ceb-4a33-88be-d90fa7109eee',
          'handle':  'Worf',
          'message': 'This post has no honor!',
          'likes_count': 0,
          'replies_count': 0,
          'reposts_count': 0,
          'created_at': (now - timedelta(days=2)).isoformat()
        }],
      }]

      if cognito_user_id != None:
        extra_crud = {
          'uuid': '68f126b0-1ceb-4a33-88be-d90fa7109fff',
          'handle':  'Lores',
          'message': 'Cloud is fun!',
          'created_at': (now - timedelta(days=2)).isoformat(),
          'expires_at': (now + timedelta(days=5)).isoformat(),
          'likes_count': 5,
          'replies_count': 1,
          'reposts_count': 0,
          'replies': [{
            'uuid': '26e12864-1c26-5c3a-9658-97a10f8fea67',
            'reply_to_activity_uuid': '68f126b0-1ceb-4a33-88be-d90fa7109eee',
            'handle':  'Worf',
            'message': 'This post has no honor!',
            'likes_count': 0,
            'replies_count': 0,
            'reposts_count': 0,
            'created_at': (now - timedelta(days=2)).isoformat()
          }],
        }
        results.insert(0, extra_crud)


      span.set_attribute("app.result_length", len(results))
      return results