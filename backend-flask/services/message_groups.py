from datetime import datetime, timedelta, timezone

from lib.ddb import Ddb
from lib.db import db
import logging

LOGGER = logging.getLogger("message_groups")

class MessageGroups:
  def run(cognito_user_id):
    model = {
      'errors': None,
      'data': None
    }

    sql = db.template('users','uuid_from_cognito_user_id')
    my_user_uuid = db.query_value(sql,{
      'cognito_user_id': cognito_user_id
    })

    LOGGER.info(f"UUID: {my_user_uuid}")

    ddb = Ddb.client()
    data = Ddb.list_message_groups(ddb, my_user_uuid)
    # LOGGER.info("list_message_groups:",data)

    model['data'] = data
    return model