from flask import Flask, jsonify
from flask import request
from flask_cors import CORS, cross_origin
import os

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

from lib.cognito_token import *

# HONEYCOMB
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# CLOUDWATCH (watchtower)
import watchtower
import logging
from time import strftime

# ROLLBAR
import rollbar
import rollbar.contrib.flask
from flask import got_request_exception

# HONEYCOMB
# Initialize tracing and an exporter that can send data to Honeycomb
# provider = TracerProvider()
# processor = BatchSpanProcessor(OTLPSpanExporter())
# provider.add_span_processor(processor)
# trace.set_tracer_provider(provider)
# tracer = trace.get_tracer(__name__)

# CLOUDWATCH

# Configuring Logger to Use CloudWatch
LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.DEBUG)
console_handler = logging.StreamHandler()
cw_handler = watchtower.CloudWatchLogHandler(log_group='cruddur')
LOGGER.addHandler(console_handler)
LOGGER.addHandler(cw_handler)
LOGGER.info("***testing logs***")

app = Flask(__name__)

cognito_token = CognitoToken(
  user_pool_id=os.getenv('AWS_COGNITO_USER_POOL_ID'),
  user_pool_client_id=os.getenv('AWS_COGNITO_USER_POOL_CLIENT_ID'),
  region=os.getenv('AWS_DEFAULT_REGION')
)

# ROLLBAR
with app.app_context():
  rollbar_access_token = os.getenv('ROLLBAR_ACCESS_TOKEN')
  """init rollbar module"""
  rollbar.init(
    # access token
    rollbar_access_token,
    # environment name - any string, like 'production' or 'development'
    'flasktest',
    # server root directory, makes tracebacks prettier
    root=os.path.dirname(os.path.realpath(__file__)),
    # flask already sets up logging
    allow_logging_basic_config=False)

  # send exceptions from `app` to rollbar, using flask's signal system.
  got_request_exception.connect(rollbar.contrib.flask.report_exception, app)

# Initialize automatic instrumentation with Flask
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()

frontend = os.getenv('FRONTEND_URL')
backend = os.getenv('BACKEND_URL')
origins = [frontend, backend]
cors = CORS(
  app,
  resources={r"/api/*": {"origins": origins}},
  headers=["Content-Type", "Authorization"],
  expose_headers=["Authorization"],
  methods=["OPTIONS,GET,HEAD,POST"]
)

@app.route('/api/health-check')
def health_check():
  return {'success': True, 'version': 1}, 200


# @app.route('/rollbar/test')
# def rollbar_test():
#   rollbar.report_message('Hello World!', 'warning')
#   return "Hello World!"

@app.after_request
def after_request(response):
  timestamp = strftime('[%Y-%b-%d %H:%M]')
  LOGGER.error('%s %s %s %s %s %s', timestamp, request.remote_addr, request.method, request.scheme, request.full_path, response.status)
  return response

@app.route("/api/message_groups", methods=['GET'])
def data_message_groups():
  access_token = CognitoToken.extract_access_token(request.headers)
  try:
    claims = cognito_token.verify(access_token)
    # authenticated request
    app.logger.debug("authenticated for message_groups")
    app.logger.debug(claims)
    cognito_user_id = claims['sub']
    model = MessageGroups.run(cognito_user_id=cognito_user_id)
    if model['errors'] is not None:
      return model['errors'], 422
    else:
      return model['data'], 200
  except TokenVerifyError as e:
    # un-authenticated request
    app.logger.debug("unauthenticated for message_groups")
    app.logger.debug(e)
    return {}, 401


@app.route("/api/messages/<string:message_group_uuid>", methods=['GET'])
def data_messages(message_group_uuid):
  access_token = CognitoToken.extract_access_token(request.headers)
  try:
    claims = cognito_token.verify(access_token)
    # authenticated request
    app.logger.debug("authenticated for messages")
    app.logger.debug(claims)
    cognito_user_id = claims['sub']
    model = Messages.run(
      cognito_user_id=cognito_user_id,
      message_group_uuid=message_group_uuid
    )
    if model['errors'] is not None:
      return model['errors'], 422
    else:
      return model['data'], 200
  except TokenVerifyError as e:
    # un-authenticated request
    app.logger.debug("unauthenticated for messages")
    app.logger.debug(e)
    return {}, 401

@app.route("/api/profile/update", methods=['POST','OPTIONS'])
@cross_origin()
def data_update_profile():
  bio          = request.json.get('bio',None)
  display_name = request.json.get('display_name',None)
  access_token = CognitoToken.extract_access_token(request.headers)
  try:
    claims = cognito_token.verify(access_token)
    cognito_user_id = claims['sub']
    model = UpdateProfile.run(
      cognito_user_id=cognito_user_id,
      bio=bio,
      display_name=display_name
    )
    if model['errors'] is not None:
      return model['errors'], 422
    else:
      return model['data'], 200
  except TokenVerifyError as e:
    # unauthenicatied request
    app.logger.debug(e)
    return {}, 401

@app.route("/api/messages", methods=['POST','OPTIONS'])
@cross_origin()
def data_create_message():
  user_handle         = request.json.get('handle',None)
  message_group_uuid  = request.json.get('message_group_uuid',None)
  message             = request.json['message']
  access_token        = CognitoToken.extract_access_token(request.headers)

  try:
    claims = cognito_token.verify(access_token)
    # authenticated request
    app.logger.debug("authenticated for message POST")
    app.logger.debug(claims)
    cognito_user_id = claims['sub']

    if message_group_uuid is None:
      model = CreateMessage.run(
        mode='create',
        message=message,
        cognito_user_id=cognito_user_id,
        user_handle=user_handle
      )
    else:
      model = CreateMessage.run(
        mode='update',
        message=message,
        cognito_user_id=cognito_user_id,
        message_group_uuid=message_group_uuid
      )

    if model['errors'] is not None:
      return model['errors'], 422
    else:
      return model['data'], 200
  except TokenVerifyError as e:
    # un-authenticated request
    app.logger.debug("unauthenticated for message POST")
    app.logger.debug(e)
    return {}, 401

@app.route("/api/activities/home", methods=['GET'])
def data_home():
  access_token = CognitoToken.extract_access_token(request.headers)
  try:
    claims = cognito_token.verify(access_token)
    app.logger.debug("claims")
    app.logger.debug(claims)
    app.logger.debug("authenticated for home")
    app.logger.debug(claims.get('username'))
    data = HomeActivities.run(cognito_user_id=claims.get('username'))
  except TokenVerifyError as e:
    app.logger.debug("unauthenticated for home")
    data = HomeActivities.run()

  return data, 200

@app.route("/api/activities/notifications", methods=['GET'])
def data_notifications():
  data = NotificationActivities.run()
  return data, 200

@app.route("/api/activities/@<string:handle>", methods=['GET'])
def data_handle(handle):
  model = UserActivities.run(handle)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/activities/search", methods=['GET'])
def data_search():
  term = request.args.get('term')
  model = SearchActivities.run(term)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/activities", methods=['POST','OPTIONS'])
@cross_origin()
def data_activities():
  user_handle  = 'denis'
  message = request.json['message']
  ttl = request.json['ttl']
  model = CreateActivity.run(message, user_handle, ttl)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

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
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/users/<string:handle>/short", methods=['GET'])
def data_users_short(handle):
  data = UsersShort.run(handle)
  return data, 200

if __name__ == "__main__":
  app.run(debug=True)