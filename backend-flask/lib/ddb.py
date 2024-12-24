import boto3
import sys
import uuid
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Ddb:
    @staticmethod
    def client():
        logger.info("**** creating dynamodb client ****")
        endpoint_url = os.getenv("AWS_ENDPOINT_URL", "http://dynamodb-local:8000")
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        attrs = {
            'endpoint_url': endpoint_url,
            'aws_access_key_id': aws_access_key_id,
            'aws_secret_access_key': aws_secret_access_key
        }

        dynamodb = boto3.resource('dynamodb', **attrs)
        return dynamodb


    def list_message_groups(client, my_user_uuid):
        logger.info("**** calling list_message_groups ****")
        table_name = "cruddur-messages"
        query_params = {
            'KeyConditionExpression': 'pk = :pk',
            'ScanIndexForward': False,
            'Limit': 20,
            'ExpressionAttributeValues': {
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
