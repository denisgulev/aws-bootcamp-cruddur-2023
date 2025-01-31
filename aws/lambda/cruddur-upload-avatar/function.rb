require 'aws-sdk-s3'
require 'json'
require 'jwt'

def handler(event:, context:)
    # return cors headers for preflight check
  if event['routeKey'] == "OPTIONS /{proxy+}"
    puts({step: 'preflight', message: 'preflight CORS check'}.to_json)
    {
      headers: {
        "Access-Control-Allow-Headers": "*, Authorization",
        "Access-Control-Allow-Origin": ENV['FRONTEND_URL'],
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
      },
      statusCode: 200
    }
  else
    if event['headers'].nil? || event['headers']['authorization'].nil?
      puts 'Authorization header missing!'
      return {
        statusCode: 401,
        body: { error: "Missing Authorization header" }.to_json
      }
    end
    token = event['headers']['authorization'].split(' ')[1]
    puts({step: 'presignedurl', access_token: token}.to_json)

    body_hash = JSON.parse(event["body"])
    extension = body_hash["extension"]

    decoded_token = JWT.decode(token, nil, false)
    cognito_user_uuid = decoded_token[0]['sub']

    s3 = Aws::S3::Resource.new
    bucket_name = ENV["UPLOADS_BUCKET_NAME"]
    object_key = "#{cognito_user_uuid}.#{extension}"

    puts({object_key: object_key}.to_json)

    obj = s3.bucket(bucket_name).object(object_key)
    url = obj.presigned_url(:put, expires_in: 60 * 5)

    puts({pre_signed_url: url}.to_json)
    {
        headers: {
            'Access-Control-Allow-Headers': '*, Authorization',
            'Access-Control-Allow-Origin': ENV['FRONTEND_URL'],
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        statusCode: 200,
        body: {url: url}.to_json
    }
  end
end