from flask import Flask
from flask import request, g
from flask_cors import cross_origin

from services.users_short import *
from services.home_activities import *
from services.notification_activities import *
from services.user_activities import *
from services.create_activity import *
from services.create_reply import *
from services.search_activities import *
from services.message_groups import *
from services.messages import *
from services.create_message import *
from services.show_activity import *
from services.update_profile import *

from lib.cognito_token import jwt_required
from lib.rollbar import init_rollbar
from lib.honeycomb import init_honeycomb
from lib.cors import init_cors
from lib.cloudwatch import init_cloudwatch

app = Flask(__name__)

## initialization
init_honeycomb(app)
with app.app_context():
  init_rollbar()
  init_cors(app)

def model_json(model):
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route('/api/health-check')
def health_check():
  return {'success': True, 'version': 1}, 200

# @app.route('/rollbar/test')
# def rollbar_test():
#   rollbar.report_message('Hello World!', 'warning')
#   return "Hello World!"

#CloudWatch logs
# @app.after_request
# def after_request(response):
#   init_cloudwatch(response)

@app.route("/api/message_groups", methods=['GET'])
@jwt_required()
def data_message_groups():
  model = MessageGroups.run(cognito_user_uuid=g.cognito_user_uuid)
  return model_json(model)


@app.route("/api/messages/<string:message_group_uuid>", methods=['GET'])
@jwt_required()
def data_messages(message_group_uuid):
  model = Messages.run(
    cognito_user_uuid=g.cognito_user_uuid,
    message_group_uuid=message_group_uuid
  )
  return model_json(model)

@app.route("/api/profile/update", methods=['POST','OPTIONS'])
@cross_origin()
@jwt_required()
def data_update_profile():
  bio          = request.json.get('bio',None)
  display_name = request.json.get('display_name',None)

  model = UpdateProfile.run(
    cognito_user_uuid=g.cognito_user_uuid,
    bio=bio,
    display_name=display_name
  )
  return model_json(model)

@app.route("/api/messages", methods=['POST','OPTIONS'])
@cross_origin()
@jwt_required()
def data_create_message():
  user_handle         = request.json.get('handle',None)
  message_group_uuid  = request.json.get('message_group_uuid',None)
  message             = request.json['message']

  if message_group_uuid is None:
    model = CreateMessage.run(
      mode='create',
      message=message,
      cognito_user_uuid=g.cognito_user_uuid,
      user_handle=user_handle
    )
  else:
    model = CreateMessage.run(
      mode='update',
      message=message,
      cognito_user_uuid=g.cognito_user_uuid,
      message_group_uuid=message_group_uuid
    )

  return model_json(model)

def default_home_feed(e):
  app.logger.debug("unauthenticated request")
  app.logger.debug(e)
  data = HomeActivities.run()
  return data, 200

@app.route("/api/activities/home", methods=['GET'])
@jwt_required(on_error=default_home_feed)
def data_home():
  data = HomeActivities.run(cognito_user_uuid=g.cognito_user_uuid)
  return data, 200

@app.route("/api/activities/notifications", methods=['GET'])
def data_notifications():
  data = NotificationActivities.run()
  return data, 200

@app.route("/api/activities/@<string:handle>", methods=['GET'])
def data_handle(handle):
  model = UserActivities.run(handle)
  return model_json(model)

@app.route("/api/activities/search", methods=['GET'])
def data_search():
  term = request.args.get('term')
  model = SearchActivities.run(term)
  return model_json(model)

@app.route("/api/activities", methods=['POST','OPTIONS'])
@cross_origin()
@jwt_required()
def data_activities():
  message = request.json['message']
  ttl = request.json['ttl']
  model = CreateActivity.run(message, g.cognito_user_uuid, ttl)
  return model_json(model)

@app.route("/api/activities/<string:activity_uuid>", methods=['GET'])
def data_show_activity(activity_uuid):
  data = ShowActivity.run(activity_uuid=activity_uuid)
  return data, 200

@app.route("/api/activities/<string:activity_uuid>/reply", methods=['POST','OPTIONS'])
@cross_origin()
def data_activities_reply(activity_uuid):
  user_handle  = 'denis'
  message = request.json['message']
  model = CreateReply.run(message, user_handle, activity_uuid)
  return model_json(model)

@app.route("/api/users/<string:handle>/short", methods=['GET'])
def data_users_short(handle):
  data = UsersShort.run(handle)
  return data, 200

if __name__ == "__main__":
  app.run(debug=True)