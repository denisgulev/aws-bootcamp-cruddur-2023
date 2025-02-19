from lib.db import db

class CreateReply:
  @staticmethod
  def run(message, cognito_user_uuid, activity_uuid):
    model = {
      'errors': None,
      'data': None
    }

    if cognito_user_uuid is None or len(cognito_user_uuid) < 1:
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
        'message': message,
        'reply_to_activity_uuid': activity_uuid
      }
    else:
      uuid = CreateReply.create_reply(cognito_user_uuid=cognito_user_uuid, activity_uuid=activity_uuid, message=message)
      object_json = CreateReply.query_object_reply(uuid)
      model['data'] = object_json
    return model
  
  @staticmethod
  def create_reply(cognito_user_uuid, activity_uuid, message):
    sql = db.template('activities','reply')

    uuid = db.query_commit(sql,{
      'cognito_user_uuid': cognito_user_uuid,
      'reply_to_activity_uuid': activity_uuid,
      'message': message,
    })

    return uuid
  
  @staticmethod
  def query_object_reply(uuid):
    sql = db.template('activities','get_object')

    return db.query_object_json(sql,{
      'uuid': uuid
    })