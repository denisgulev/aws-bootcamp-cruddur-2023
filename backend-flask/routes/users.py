# flask
from flask import request, g

# decorators
from lib.cognito_token import jwt_required
from flask_cors import cross_origin

# services
from services.users_short import *
from services.update_profile import *
from services.show_activity import *

# helpers
from lib.helpers import model_json

def load(app):
    @app.route("/api/profile/update", methods=['PUT'])
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

    @app.route("/api/users/<string:handle>/short", methods=['GET'])
    def data_users_short(handle):
        data = UsersShort.run(handle)
        return data, 200

    @app.route("/api/activities/@<string:handle>", methods=['GET'])
    def data_users_activities(handle):
        model = UserActivities.run(handle)
        return model_json(model)

    @app.route("/api/activities/@<string:handle>/status/<string:activity_uuid>", methods=['GET'])
    def data_show_activity(handle,activity_uuid):
        data = ShowActivity.run(handle, activity_uuid)
        return data, 200