import boto3
import sys
import uuid
import os
from datetime import datetime, timezone
import logging
import botocore.exceptions

logger = logging.getLogger(__name__)

class Ddb:
    @staticmethod
    def client():
        logger.info("**** Creating DynamoDB client ****")
        endpoint_url = os.getenv("AWS_ENDPOINT_URL", None)
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        if endpoint_url is None:
            attrs = {}
        else:
            attrs = {
                'endpoint_url': "http://dynamodb-local:8000",
                'aws_access_key_id': aws_access_key_id,
                'aws_secret_access_key': aws_secret_access_key
            }

        dynamodb = boto3.resource('dynamodb', **attrs)
        return dynamodb


    @staticmethod
    def list_message_groups(client, my_user_uuid):
        logger.info("**** calling list_message_groups ****")
        table_name = "cruddur-messages"
        current_year = str(datetime.now().year)
        query_params = {
            'KeyConditionExpression': 'pk = :pk AND begins_with(sk, :year)',
            'ScanIndexForward': False,
            'Limit': 20,
            'ExpressionAttributeValues': {
                ':year': current_year,
                ':pk': f"GRP#{my_user_uuid}",
            },
        }
        # Access the table using the high-level API
        table = client.Table(table_name)


        # Query the table
        response = table.query(**query_params)
        logger.info("response:", response)
        items = response['Items']

        results = []
        for item in items:
            last_sent_at = item['sk']
            results.append({
                'uuid': item['message_group_uuid'],
                'display_name': item['user_display_name'],
                'handle': item['user_handle'],
                'message': item['message'],
                'created_at': last_sent_at,
            })
        return results


    @staticmethod
    def list_messages(client, my_user_uuid, message_group_uuid):
        logger.info("**** calling list_messages ****")
        table_name = "cruddur-messages"
        current_year = str(datetime.now().year)
        query_params = {
            'KeyConditionExpression': 'pk = :pk AND begins_with(sk, :year)',
            'ScanIndexForward': False,
            'Limit': 20,
            'ExpressionAttributeValues': {
                ':year': current_year,
                ':pk': f"MSG#{message_group_uuid}",
            },
        }
        # Access the table using the high-level API
        table = client.Table(table_name)

        # Query the table
        response = table.query(**query_params)
        logger.info("response:", response)
        items = response['Items']
        items.reverse()

        results = []
        for item in items:
            last_sent_at = item['sk']
            results.append({
                'uuid': item['message_uuid'],
                'display_name': item['user_display_name'],
                'handle': item['user_handle'],
                'message': item['message'],
                'created_at': last_sent_at,
            })
        return results


    @staticmethod
    def create_message(client,message_group_uuid, message, my_user_uuid, my_user_display_name, my_user_handle):
        now = datetime.now(timezone.utc).astimezone().isoformat()
        table_name = "cruddur-messages"
        created_at = now
        message_uuid = str(uuid.uuid4())

        record = {
            'pk':   f"MSG#{message_group_uuid}",
            'sk':   created_at,
            'message': message,
            'message_uuid': message_uuid,
            'user_uuid': my_user_uuid,
            'user_display_name': my_user_display_name,
            'user_handle': my_user_handle
        }

        # Access the table using the high-level API
        table = client.Table(table_name)

        # insert the record into the table
        response = table.put_item(
            Item=record
        )
        # print the response
        print(response)
        return {
            'message_group_uuid': message_group_uuid,
            'uuid': my_user_uuid,
            'display_name': my_user_display_name,
            'handle':  my_user_handle,
            'message': message,
            'created_at': created_at
        }

    @staticmethod
    def create_message_group(client, message,my_user_uuid, my_user_display_name, my_user_handle, other_user_uuid, other_user_display_name, other_user_handle):
        logger.info('== create_message_group.1')
        table_name = 'cruddur-messages'

        message_group_uuid = str(uuid.uuid4())
        message_uuid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).astimezone().isoformat()
        last_message_at = now
        created_at = now
        logger.info('== create_message_group.2')

        my_message_group = {
            'pk': f"GRP#{my_user_uuid}",
            'sk': last_message_at,
            'message_group_uuid': message_group_uuid,
            'message': message,
            'user_uuid': other_user_uuid,
            'user_display_name': other_user_display_name,
            'user_handle':  other_user_handle
        }
        logger.info(f"my_message_group: {my_message_group}")

        logger.info('== create_message_group.3')
        other_message_group = {
            'pk': f"GRP#{other_user_uuid}",
            'sk': last_message_at,
            'message_group_uuid': message_group_uuid,
            'message': message,
            'user_uuid': my_user_uuid,
            'user_display_name': my_user_display_name,
            'user_handle':  my_user_handle
        }
        logger.info(f"other_message_group: {other_message_group}")

        logger.info('== create_message_group.4')
        message = {
            'pk':   f"MSG#{message_group_uuid}",
            'sk':   created_at ,
            'message': message,
            'message_uuid': message_uuid,
            'user_uuid': my_user_uuid,
            'user_display_name': my_user_display_name,
            'user_handle': my_user_handle
        }
        logger.info(f"message: {message}")

        items = {
            table_name: [
                {'PutRequest': {'Item': my_message_group}},
                {'PutRequest': {'Item': other_message_group}},
                {'PutRequest': {'Item': message}}
            ]
        }
        logger.info(f"items: {items}")

        try:
            logger.info('== create_message_group.try')
            # Begin the transaction
            response = client.batch_write_item(RequestItems=items)
            return {
                'message_group_uuid': message_group_uuid
            }
        except botocore.exceptions.ClientError as e:
            logger.info('== create_message_group.error')
            logger.error(e)