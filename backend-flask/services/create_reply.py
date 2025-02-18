import uuid
from datetime import datetime, timezone

class CreateReply:
  @staticmethod
  def run(message, user_handle, activity_uuid):
    model = {
      'errors': None,
      'data': None
    }

    if user_handle is None or len(user_handle) < 1:
      model['errors'] = ['user_handle_blank']

    if activity_uuid is None or len(activity_uuid) < 1:
      model['errors'] = ['activity_uuid_blank']

    if message is None or len(message) < 1:
      model['errors'] = ['message_blank'] 
    elif len(message) > 1024:
      model['errors'] = ['message_exceed_max_chars'] 

    if model['errors']:
      # return what we provided
      model['data'] = {
        'display_name': 'Andrew Brown',
        'handle':  user_handle,
        'message': message,
        'reply_to_activity_uuid': activity_uuid
      }
    else:
      now = datetime.now(timezone.utc).astimezone()
      model['data'] = {
        'uuid': uuid.uuid4(),
        'display_name': 'Andrew Brown',
        'handle':  user_handle,
        'message': message,
        'created_at': now.isoformat(),
        'reply_to_activity_uuid': activity_uuid
      }
    return model