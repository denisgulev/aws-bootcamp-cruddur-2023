from datetime import datetime, timedelta, timezone
from lib.ddb import Ddb
from lib.db import db

class Messages:
  def run(cognito_user_id, message_group_uuid):
    model = {
      'errors': None,
      'data': None
    }

    sql = db.template('users','uuid_from_cognito_user_id')
    my_user_uuid = db.query_value(sql,{
      'cognito_user_id': cognito_user_id
    })

    ddb = Ddb.client()
    data = Ddb.list_messages(ddb, my_user_uuid, message_group_uuid)
    model['data'] = data

    return model