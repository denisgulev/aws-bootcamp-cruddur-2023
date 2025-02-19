# flask
from flask import request, g

# decorators
from lib.cognito_token import jwt_required
from flask_cors import cross_origin

# services
from services.message_groups import *
from services.messages import *
from services.create_message import *

# helpers
from lib.helpers import model_json

def load(app):
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