# flask
from flask import request, g

# decorators
from lib.cognito_token import jwt_required
from flask_cors import cross_origin

# helpers
from lib.helpers import model_json
from lib.cloudwatch import init_cloudwatch

def load(app):
    @app.route('/api/health-check')
    def health_check():
        return {'success': True, 'version': 1}, 200

    # @app.route('/rollbar/test')
    # def rollbar_test():
    #   g.rollbar.report_message('Hello World!', 'warning')
    #   return "Hello World!"

    #CloudWatch logs
    # @app.after_request
    # def after_request(response):
    #   init_cloudwatch(response)