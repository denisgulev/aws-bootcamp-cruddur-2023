from datetime import datetime, timedelta, timezone
from lib.db import db
import logging

logging.basicConfig(
  level=logging.DEBUG,  # Set to DEBUG to capture all levels of logs
  format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
  handlers=[logging.StreamHandler()]  # Ensures logs are directed to the console
)

logger = logging.getLogger(__name__)


class CreateActivity:
  @staticmethod
  def run(message, cognito_user_uuid, ttl):
    model = {
      'errors': None,
      'data': None
    }

    now = datetime.now(timezone.utc).astimezone()
    if ttl == '30-days':
      ttl_offset = timedelta(days=30)
    elif ttl == '7-days':
      ttl_offset = timedelta(days=7)
    elif ttl == '3-days':
      ttl_offset = timedelta(days=3)
    elif ttl == '1-day':
      ttl_offset = timedelta(days=1)
    elif ttl == '12-hours':
      ttl_offset = timedelta(hours=12)
    elif ttl == '3-hours':
      ttl_offset = timedelta(hours=3)
    elif ttl == '1-hour':
      ttl_offset = timedelta(hours=1)
    else:
      model['errors'] = ['ttl_blank']

    if cognito_user_uuid is None or len(cognito_user_uuid) < 1:
      model['errors'] = ['cognito_user_uuid_blank']

    if message is None or len(message) < 1:
      model['errors'] = ['message_blank']
    elif len(message) > 280:
      model['errors'] = ['message_exceed_max_chars']

    if model['errors']:
      model['data'] = {
        'handle':  cognito_user_uuid,
        'message': message
      }
    else:
      uuid = CreateActivity.create_activity(cognito_user_uuid=cognito_user_uuid, message=message, expires_at=(now + ttl_offset).isoformat())
      object_json = CreateActivity.query_object_activity(uuid)
      model['data'] = object_json
    return model

  @staticmethod
  def create_activity(cognito_user_uuid, message, expires_at):
    sql = f"""
      INSERT INTO public.activities (user_uuid, message, expires_at) 
      VALUES (
        (SELECT uuid FROM public.users WHERE users.cognito_user_uuid = %(cognito_user_uuid)s LIMIT 1),
        %(message)s, 
        %(expires_at)s
      ) RETURNING uuid;
    """

    uuid = db.query_commit_with_returning_id(sql,{
                                               'cognito_user_uuid': cognito_user_uuid,
                                               'message': message,
                                               'expires_at': expires_at
    })

    return uuid

  @staticmethod
  def query_object_activity(uuid):
    sql = f"""
      SELECT
        activities.uuid,
        users.display_name,
        users.handle,
        activities.message,
        activities.created_at,
        activities.expires_at
      FROM public.activities
      INNER JOIN public.users ON users.uuid = activities.user_uuid 
      WHERE 
        activities.uuid = %(uuid)s
    """
    return db.query_object_json(sql,{
      'uuid': uuid
    })