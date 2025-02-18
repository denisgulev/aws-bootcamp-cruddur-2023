import json
import psycopg2
import sys
import logging
import os

print("*** START")
logger = logging.getLogger()
print("*** AFTER LOGGER SETUP")

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
    user_cognito_uuid     = user['sub']

    cur = conn.cursor()
    sql = f"""
        INSERT INTO public.users (
                display_name, 
                email, 
                handle, 
                cognito_user_uuid
            ) 
            VALUES(
                %s, 
                %s, 
                %s, 
                %s
            )
    """
    print("SQL query to be executed: ", sql)
    cur.execute(sql, (user_display_name, user_email, user_handle, user_cognito_uuid))
    conn.commit()

    return event