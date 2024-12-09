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
chmod u+x bin/db-connect
```

To execute the script:
```sh
./bin/db-connect
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

## Make prints nicer

We can make prints for our shell scripts coloured so we can see what we're doing:

https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux


```sh
CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="db-schema-load"
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"
```