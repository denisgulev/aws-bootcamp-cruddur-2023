# Week 2 — Distributed Tracing

## Observability vs Monitoring

**Observability** is the ability to understand a complex system’s internal state based on external outputs. 
When a system is observable, a user can identify the root cause of a performance problem by looking at the data it produces without additional testing or coding.

Observability features:
1. decrease alert fatigue
2. troubleshoot and resolve things quickly
3. accelerate collaboration between teams
4. reduce overall operational cost

**Monitoring** is the task of assessing the health of a system by collecting and analyzing aggregate data 
from IT systems based on a predefined set of metrics and logs.
It measures the health of the application, such as creating a rule that alerts when 
the app is nearing 100% disk usage, helping prevent downtime. 
It shows you not only how the app is functioning, but also how it’s being used over time.

3 Pillars of Observability:
1. Metrics
   1. A numerical assessment of application performance and resource utilization.
2. Traces
   1. How operations move throughout a system, from one node to another.
3. Logs
   1. A record of what’s happening within your software


On AWS:

- **CloudTrail** -> for a cloudTrail trail, we can create a cloudWatch log, that will create a cloudwatch log group.

- **CloudWatch** -> in cloudwatch logs we can create metrics, to associate specific terms in the logs and take action on particular events happening.



## HoneyComb

Create a new environment in Honeycomb to receive a new API_KEY.
Follow along the instructions to set up for your programming language, if you're not using python.

In our project, we'll set up honeycomb using python:

We'll add the following files to our `requirements.txt`

```
opentelemetry-api 
opentelemetry-sdk 
opentelemetry-exporter-otlp-proto-http 
opentelemetry-instrumentation-flask 
opentelemetry-instrumentation-requests
```

We'll install these dependencies:

```sh
pip install -r requirements.txt
```

Add the following to the `app.py`

```py
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
```

```py
# Initialize tracing and an exporter that can send data to Honeycomb
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)
```

```py
# Initialize automatic instrumentation with Flask
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()
```

Add the following Env Vars to `backend-flask` in docker compose

```yml
OTEL_EXPORTER_OTLP_ENDPOINT: "https://api.honeycomb.io"
OTEL_EXPORTER_OTLP_HEADERS: "x-honeycomb-team=${HONEYCOMB_API_KEY}"
OTEL_SERVICE_NAME: "backend-flask"
```

Add the following Env Vars to `frontend-react-js` in docker compose

```yml
OTEL_EXPORTER_OTLP_ENDPOINT: "https://api.honeycomb.io"
OTEL_EXPORTER_OTLP_HEADERS: "x-honeycomb-team=${HONEYCOMB_API_KEY}"
OTEL_SERVICE_NAME: "frontend-react-js"
```

You'll need to grab the API key from your honeycomb account:

```sh
export HONEYCOMB_API_KEY="<api-key>"
env | grep HONEYCOMB_API_KEY
```

After this we can run the docker-compose file and see the traces on Honeycomb dashboard.

Using personalized "spans", we could log crucial information for debugging directly on honeycomb, without the need to visualize the logs of the container.

## X-Ray

### Instrument AWS X-Ray for Flask


```sh
export AWS_REGION="ca-central-1"
gp env AWS_REGION="ca-central-1"
```

Add to the `requirements.txt`

```py
aws-xray-sdk
```

Install pythonpendencies

```sh
pip install -r requirements.txt
```

Add to `app.py`

```py
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

xray_url = os.getenv("AWS_XRAY_URL")
xray_recorder.configure(service='Cruddur', dynamic_naming=xray_url)
XRayMiddleware(app, xray_recorder)
```

## CloudWatch Logs

Add to the `requirements.txt`

```
watchtower
```
This allows us to send logs to CloudWatch.

```sh
pip install -r requirements.txt
```


In `app.py`

```
import watchtower
import logging
from time import strftime
```

```py
# Configuring Logger to Use CloudWatch
LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.DEBUG)
console_handler = logging.StreamHandler()
cw_handler = watchtower.CloudWatchLogHandler(log_group='cruddur')
LOGGER.addHandler(console_handler)
LOGGER.addHandler(cw_handler)
LOGGER.info("some message")
```

```py
@app.after_request
def after_request(response):
    timestamp = strftime('[%Y-%b-%d %H:%M]')
    LOGGER.error('%s %s %s %s %s %s', timestamp, request.remote_addr, request.method, request.scheme, request.full_path, response.status)
    return response
```

We'll log something in an API endpoint
```py
LOGGER.info('Hello Cloudwatch! from  /api/activities/home')
```

Set the env var in your backend-flask for `docker-compose.yml`

```yml
      AWS_DEFAULT_REGION: "${AWS_DEFAULT_REGION}"
      AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID}"
      AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY}"
```

> passing AWS_REGION doesn't seem to get picked up by boto3 so pass default region instead


## Rollbar

This tool is useful for error tracking and monitoring.

https://rollbar.com/

Create a new project in Rollbar called `Cruddur`

Add to `requirements.txt`

```
blinker
rollbar
```

Install deps

```sh
pip install -r requirements.txt
```

We need to set our access token

```sh
export ROLLBAR_ACCESS_TOKEN=""
gp env ROLLBAR_ACCESS_TOKEN=""
```

Add to backend-flask for `docker-compose.yml`

```yml
ROLLBAR_ACCESS_TOKEN: "${ROLLBAR_ACCESS_TOKEN}"
```

Import for Rollbar

```py
import rollbar
import rollbar.contrib.flask
from flask import got_request_exception
```

```py
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
```

We'll add an endpoint just for testing rollbar to `app.py`

```py
@app.route('/rollbar/test')
def rollbar_test():
    rollbar.report_message('Hello World!', 'warning')
    return "Hello World!"
```

[Rollbar Flask Example](https://github.com/rollbar/rollbar-flask-example/blob/master/hello.py)