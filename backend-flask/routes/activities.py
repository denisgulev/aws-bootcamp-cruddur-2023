# flask
from flask import request, g

# decorators
from lib.cognito_token import jwt_required
from flask_cors import cross_origin

# services
from services.home_activities import *
from services.notification_activities import *
from services.user_activities import *
from services.create_activity import *
from services.create_reply import *
from services.search_activities import *

# helpers
from lib.helpers import model_json

def load(app):
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

    @app.route("/api/activities/<string:activity_uuid>/reply", methods=['POST','OPTIONS'])
    @cross_origin()
    @jwt_required()
    def data_activities_reply(activity_uuid):
        message = request.json['message']
        model = CreateReply.run(message, g.cognito_user_uuid, activity_uuid)
        return model_json(model)