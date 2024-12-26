from datetime import datetime, timedelta, timezone

from lib.db import db
from lib.ddb import Ddb
import logging

LOGGER = logging.getLogger("create_message")

class CreateMessage:
  # mode indicates if we want to create a new message_group or using an existing one
  def run(mode, message, cognito_user_id, message_group_uuid=None, user_handle=None):
    LOGGER.info(f"mode: ${mode}")
    LOGGER.info(f"message: ${message}")
    LOGGER.info(f"cognito_user_id: ${cognito_user_id}")
    LOGGER.info(f"message_group_uuid: ${message_group_uuid}")
    LOGGER.info(f"user_handle: ${user_handle}")

    model = {
      'errors': None,
      'data': None
    }

    if mode == "update":
      if message_group_uuid is None or len(message_group_uuid) < 1:
        model['errors'] = ['message_group_uuid_blank']


    if cognito_user_id is None or len(cognito_user_id) < 1:
      model['errors'] = ['cognito_user_id_blank']

    if mode == "create":
      if user_handle is None or len(user_handle) < 1:
        model['errors'] = ['user_receiver_handle_blank']

    if message is None or len(message) < 1:
      model['errors'] = ['message_blank']
    elif len(message) > 1024:
      model['errors'] = ['message_exceed_max_chars']

    if model['errors']:
      # return what we provided
      model['data'] = {
        'display_name': 'Andrew Brown',
        'handle':  user_handle,
        'message': message
      }
    else:
      sql = db.template('users','create_message_users')

      if user_handle is None:
        rev_handle = ''
      else:
        rev_handle = user_handle
      users = db.query_array(sql,{
        'cognito_user_id': cognito_user_id,
        'user_receiver_handle': rev_handle
      })
      LOGGER.info("USERS =-=-=-=-==")
      LOGGER.info(users)

      my_user    = next((item for item in users if item["kind"] == 'sender'), None)
      other_user = next((item for item in users if item["kind"] == 'recv')  , None)

      LOGGER.info("USERS=[my-user]==")
      LOGGER.info(my_user)
      LOGGER.info("USERS=[other-user]==")
      LOGGER.info(other_user)

      ddb = Ddb.client()

      if mode == "update":
        data = Ddb.create_message(
          client=ddb,
          message_group_uuid=message_group_uuid,
          message=message,
          my_user_uuid=my_user['uuid'],
          my_user_display_name=my_user['display_name'],
          my_user_handle=my_user['handle']
        )
      elif mode == "create":
        data = Ddb.create_message_group(
          client=ddb,
          message=message,
          my_user_uuid=my_user['uuid'],
          my_user_display_name=my_user['display_name'],
          my_user_handle=my_user['handle'],
          other_user_uuid=other_user['uuid'],
          other_user_display_name=other_user['display_name'],
          other_user_handle=other_user['handle']
        )
      model['data'] = data
    return model