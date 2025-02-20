from flask import Flask, g

from lib.rollbar import init_rollbar
from lib.honeycomb import init_honeycomb
from lib.cors import init_cors

import routes.activities
import routes.users
import routes.messages
import routes.general

app = Flask(__name__)

## initialization
init_honeycomb(app)
init_cors(app)
with app.app_context():
  g.rollbar = init_rollbar(app)

## load routes
routes.activities.load(app)
routes.users.load(app)
routes.messages.load(app)
routes.general.load(app)

if __name__ == "__main__":
  app.run(debug=True)