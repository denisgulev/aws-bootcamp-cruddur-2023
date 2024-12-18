# Week 4 — Postgres and RDS

-> Run docker compose file and explore psql commands as specified below.

To connect to psql via the psql client cli tool remember to use the host flag to specific localhost.

```
psql -Upostgres --host localhost
```

Common PSQL commands:

```sql
\x on -- expanded display when looking at data
\q -- Quit PSQL
\l -- List all databases
\c database_name -- Connect to a specific database
\dt -- List all tables in the current database
\d table_name -- Describe a specific table
\du -- List all users and their roles
\dn -- List all schemas in the current database
CREATE DATABASE database_name; -- Create a new database
DROP DATABASE database_name; -- Delete a database
CREATE TABLE table_name (column1 datatype1, column2 datatype2, ...); -- Create a new table
DROP TABLE table_name; -- Delete a table
SELECT column1, column2, ... FROM table_name WHERE condition; -- Select data from a table
INSERT INTO table_name (column1, column2, ...) VALUES (value1, value2, ...); -- Insert data into a table
UPDATE table_name SET column1 = value1, column2 = value2, ... WHERE condition; -- Update data in a table
DELETE FROM table_name WHERE condition; -- Delete data from a table
```

## Create our database

First open a psql client:

```sh
psql -U postgres -h localhost
```

Create a new database within the PSQL client:

```sql
CREATE database cruddur;
```

## Import Script

We'll create a new SQL file called `schema.sql`
and we'll place it in `backend-flask/db`

The command to import:
```
psql cruddur < db/schema.sql -h localhost -U postgres
```


## Add UUID Extension

We are going to have Postgres generate out UUIDs.
We'll need to use an extension called:

```sql
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Create our tables

https://www.postgresql.org/docs/current/sql-createtable.html

```sql
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.activities;
```

```sql
CREATE TABLE public.users (
  uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  display_name text,
  handle text,
  cognito_user_id text,
  created_at TIMESTAMP default current_timestamp NOT NULL
);
```

```sql
CREATE TABLE public.activities (
  uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_uuid UUID NOT NULL REFERENCES public.users(uuid),
  message text NOT NULL,
  replies_count integer DEFAULT 0,
  reposts_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  reply_to_activity_uuid integer,
  expires_at TIMESTAMP,
  created_at TIMESTAMP default current_timestamp NOT NULL
);
```

## Shell Script to Connect to DB

For things we commonly need to do we can create a new directory called `bin`, where we will put our scripts.

```sh
mkdir /aws-bootcamp-cruddur-2023/backend-flask/bin
```

```sh
export CONNECTION_URL="postgresql://postgres:password@127.0.0.1:5432/cruddur"
```

We'll create a new bash script `bin/db-connect`

** For the shebang line, run in a terminal ```sh whereis bash``` to find the path to bash

```sh
#! /bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-connect"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

if [ "$1" = "prod" ]; then
  echo "using production"
  CON_URL=$PROD_CONNECTION_URL
else
  CON_URL=$CONNECTION_URL
fi

psql $CON_URL
```

We'll make it executable:

```sh
chmod u+x bin/connect
```

To execute the script:
```sh
./bin/connect
```

## Shell script to drop the database

`bin/db-drop`

```sh
#! /bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-drop"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

NO_DB_CONNECTION_URL=$(sed 's/\/cruddur//g' <<< "$CONNECTION_URL") # Remove the database name from the connection URL
psql $NO_DB_CONNECTION_URL -c "drop database cruddur;"
```

https://askubuntu.com/questions/595269/use-sed-on-a-string-variable-rather-than-a-file

## Shell script to create the database

`bin/db-create`

```sh
#! /bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-create"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

NO_DB_CONNECTION_URL=$(sed 's/\/cruddur//g' <<< "$CONNECTION_URL")  # Remove the database name from the connection URL
psql $NO_DB_CONNECTION_URL -c "create database cruddur;"
```

## Shell script to load the schema

`bin/db-schema-load`

```sh
#! /bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-schema-load"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

schema_path="$(realpath .)/db/schema.sql"

if [ "$1" = "prod" ]; then
  echo "using production"
  CON_URL=$PROD_CONNECTION_URL
else
  CON_URL=$CONNECTION_URL
fi

psql $CON_URL cruddur < $schema_path
```

## Shell script to load the seed data

`bin/db-seed`
```sh
#! /bin/bash

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-seed"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

seed_path="$(realpath .)/db/seed.sql"

if [ "$1" = "prod" ]; then
  echo "using production"
  CON_URL=$PROD_CONNECTION_URL
else
  CON_URL=$CONNECTION_URL
fi

psql $CON_URL cruddur < $seed_path
```

## Update Bash scripts for production

```sh
if [ "$1" = "prod" ]; then
  echo "using production"
else
fi
```

## Create a "setup" script


`bin/db-setup`
```sh
#! /bin/bash

-e # stop the execution if it fails at any point

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-setup"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

bin_path="$(realpath .)/bin"

source "$bin_path/db-drop"
source "$bin_path/db-create"
source "$bin_path/db-schema-load"
source "$bin_path/db-seed"
```

## Make prints nicer

We can make prints for our shell scripts coloured so we can see what we're doing:

https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux


```sh
CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-schema-load"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"
```

## RDS Security Best Practices

1. Make sure the RDS instance is created in your region
2. Use a custom port
3. "publicly accessible" should be set to "No"
4. deletion protection should be enabled
5. in security groups, only allow certain IPs for inbound connections
6. create custom VPCs, restricting the IPs that can connect to the RDS instance
7. CloudTrail helps monitor and log alerts on malicious RDS behaviour


## Install Postgres Client

```yml
  backend-flask:
    environment:
      CONNECTION_URL: "${CONNECTION_URL}"
```

https://www.psycopg.org/psycopg3/

We'll add the following to our `requirments.txt`

```
psycopg[binary]
psycopg[pool]
```

```
pip install -r requirements.txt
```

We are going to make use of "Connection pooling" to manage connections to the database.

A connection pool is an object managing a set of connections and allowing their use 
in functions needing one. Because the time to establish a new connection can be relatively long, 
keeping connections open can reduce latency.

## DB Object and Connection Pooling

1. Add "CONNECTION_URL" to backend-flask environment variables in the docker-compose file
```yaml
CONNECTION_URL: "postgresql://postgres:password@db:5432/cruddur"
```
2. Create a new file `db.py` in the `backend-flask/lib` directory
```
from psycopg_pool import ConnectionPool
import os


def query_wrap_object(template):
    return f'''
      (SELECT COALESCE(row_to_json(object_row),'{{}}'::json) FROM (
      {template}
      ) object_row);
    '''


def query_wrap_array(template):
    return f'''
      (SELECT COALESCE(array_to_json(array_agg(row_to_json(array_row))),'[]'::json) FROM (
      {template}
      ) array_row);
    '''


connection_url = os.getenv("CONNECTION_URL")
pool = ConnectionPool(connection_url)
```
3. Integrate pooling inside home_activities.py
```
from lib.db import pool, query_wrap_array

# Define a logger to log information during the process
logging.basicConfig(
  level=logging.DEBUG,  # Set to DEBUG to capture all levels of logs
  format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
  handlers=[logging.StreamHandler()]  # Ensures logs are directed to the console
)

logger = logging.getLogger(__name__)

class HomeActivities:
  def run(cognito_user_id=None):

    with tracer.start_as_current_span("home-activities-mock-data"):
      ....
      ....
      
      sql = query_wrap_array("""
        SELECT
          activities.uuid,
          users.display_name,
          users.handle,
          activities.message,
          activities.replies_count,
          activities.reposts_count,
          activities.likes_count,
          activities.reply_to_activity_uuid,
          activities.expires_at,
          activities.created_at
        FROM public.activities
        LEFT JOIN public.users ON users.uuid = activities.user_uuid
        ORDER BY activities.created_at DESC
      """)

      try:
        logger.info("Attempting to acquire a database connection...")
        with pool.connection() as conn:  # Acquire a connection from the pool
          logger.info("Database connection acquired successfully.")
          with conn.cursor() as cur:
            logger.info(f"Executing query... {sql}")
            cur.execute(sql)
            json = cur.fetchone()  # Fetch a single row from the table

            logger.info("Query executed successfully. Returning results.")
            if json:
              return json[0]
      except Exception as e:
        logger.error("An error occurred while fetching data.", exc_info=True)
      return None
```

## Provision RDS

```
aws rds create-db-instance \
--db-instance-identifier cruddur-db-instance \
--db-instance-class db.t4g.micro \
--engine postgres \
--engine-version  14.9 \
--master-username root \
--master-user-password huEE33z2Qvl383 \
--allocated-storage 20 \
--availability-zone eu-central-1a \
--backup-retention-period 0 \
--port 5432 \
--no-multi-az \
--db-name cruddur \
--storage-type gp2 \
--publicly-accessible \
--storage-encrypted \
--enable-performance-insights \
--performance-insights-retention-period 7 \
--no-deletion-protection
```

## Test remote access

To allow our local machine to connect to the RDS instance, we need to add our IP address to the security group of the RDS instance.

1. go to RDS instance
2. access "VPC security group"
3. edit inbound rules, by adding local IP address to the security group (use ```curl ifconfig.me``` to find out your current IP)
4. run the following command
```
psql postgresql://root:huEE33z2Qvl383@<rds-endpoint>:5432/cruddur
```

## Connect to RDS from local environment

In order to connect to the RDS instance we need to provide our Gitpod IP and whitelist for inbound traffic on port 5432.

We'll create an inbound rule for Postgres (5432) and provide the GITPOD ID.

We'll get the security group rule id so we can easily modify it in the future from the terminal here in Gitpod.

```sh
export DB_SG_ID="<security-group-id>"
export DB_SG_RULE_ID="<security-group-rule-id>"
```

Whenever we need to update our security groups we can do this for access.
```sh
aws ec2 modify-security-group-rules \
    --group-id $DB_SG_ID \
    --security-group-rules "SecurityGroupRuleId=$DB_SG_RULE_ID,SecurityGroupRule={Description=localdev,IpProtocol=tcp,FromPort=5432,ToPort=5432,CidrIpv4=$(curl ifconfig.me)/32}"
```

https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ec2/modify-security-group-rules.html#examples

## Load schema in RDS

To load the db-schema in RDS:
1. make sure RDS is running
2. make sure $PROD_CONNECT_URL is set correctly -> ```export PROD_CONNECTION_URL="<rds-endpoint>"```
3. execute "db-schema-load" script, passing "prod" as an argument
4. test that the schema is loaded correctly:
   1. connect to RDS -> ```./bin/db-connect prod```
   2. check "cruddur" database exists --> ```\l```
   3. check tables are created successful -> ```\dt```


## Save user in db after registration

In order to execute CRUD operations for the activities (posts), we need to save the users in RDS.

We can achieve this by triggering a Lambda function right after the registration with Cognito is completed.

1. https://medium.com/@jenniferjasperse/how-to-use-postgres-with-aws-lambda-and-python-44e9d9154513
download required binaries and store them in the same folder as "lambda_function.py" file
   1. lambda_function.py is as follows
```python
import json
import psycopg2
import sys
import os

print("*** START")

try:
   print("*** TRYING TO CONNECT TO RDS")
   conn = psycopg2.connect(os.getenv('CONNECTION_URL'))
except (Exception, psycopg2.DatabaseError) as error:
   print("ERROR: Could not connect to postgres instance.")
   print(error)
   sys.exit()

print("SUCCESS: Connection to RDS Postgres succeeded.")

def lambda_handler(event, context):
   user = event['request']['userAttributes']
   print("USER: ", user)
   user_display_name   = user['name']
   user_email          = user['email']
   user_handle         = user['preferred_username']
   user_cognito_id     = user['sub']

   cur = conn.cursor()
   sql = f"""
     INSERT INTO public.users (
             display_name, 
             email, 
             handle, 
             cognito_user_id
         ) 
         VALUES(
             '{user_display_name}', 
             '{user_email}', 
             '{user_handle}', 
             '{user_cognito_id}'
         )
   """
   print("SQL query to be executed: ", sql)
   cur.execute(sql)
   conn.commit()
   
   return event
```
2. zip the content of this folder -> ```zip -r aws-pg2.zip .```
3. create a lambda function on AWS and "Upload from" zip file, by selecting the zip created at point 2
4. create a role with the right permissions -> https://codedamn.com/news/aws/provided-execution-role-does-not-have-permissions-to-call-createnetworkinterface-on-ec2
   1. or modify lambda's execution Role, by adding "AWSLambdaVPCAccessExecutionRole" permission
5. add the lambda to a VPC
6. add ENV variable in lambda configuration: ```CONNECTION_URL=<postgresql-rds-connection-string>```
7. go to "user-pool -> Authentication -> Extensions -> Add Lambda trigger"
8. create a new user
9. check lambda logs
10. check the user is created in database