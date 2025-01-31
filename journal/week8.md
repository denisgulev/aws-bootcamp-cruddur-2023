# Week 8 — Serverless Image Processing

AWS CDK - cloud development kit, also known as infrastructure as code. It allows you to define your cloud infrastructure in code and provision it through AWS CloudFormation.

## Image Process Flow

1. An image is uploaded to a specific input folder in the S3 bucket.
2. The OBJECT_CREATED_PUT event triggers the Lambda function.
3. The Lambda function:
   1. Retrieves the original image.
   2. Processes it (resize and convert to PNG).
   3. Uploads the processed image to the output folder. 
4. Once the image is uploaded to the output folder, an SNS topic is notified.
5. Subscribers (e.g., a webhook) are alerted about the processed image.

## Install AWS CDK

Follow official instruction to setup aws-cdk -> https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html

We will be using Typescript with the CDK.

The installation create a *-stack.ts file, where we can define the resources we want to provision on AWS.

## Load Env Vars
```js
const dotenv = require('dotenv');
dotenv.config();

const bucketName: string = process.env.THUMBING_BUCKET_NAME as string;
const folderInput: string = process.env.THUMBING_S3_FOLDER_INPUT as string;
const folderOutput: string = process.env.THUMBING_S3_FOLDER_OUTPUT as string;
const webhookUrl: string = process.env.THUMBING_WEBHOOK_URL as string;
const topicName: string = process.env.THUMBING_TOPIC_NAME as string;
const functionPath: string = process.env.THUMBING_FUNCTION_PATH as string;
console.log('bucketName',bucketName)
console.log('folderInput',folderInput)
console.log('folderOutput',folderOutput)
console.log('webhookUrl',webhookUrl)
console.log('topicName',topicName)
console.log('functionPath',functionPath)
```

## Create Bucket
```js
import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = this.createBucket(bucketName)

createBucket(bucketName: string): s3.IBucket {
  const logicalName: string = 'ThumbBucket';
  const bucket = new s3.Bucket(this, logicalName , {
    bucketName: bucketName,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });
  return bucket;
}
```

## Create Lambda
```js
import * as lambda from 'aws-cdk-lib/aws-lambda';

const lambda = this.createLambda(folderInput,folderOutput,functionPath,bucketName)

createLambda(folderIntput: string, folderOutput: string, functionPath: string, bucketName: string): lambda.IFunction {
  const logicalName = 'ThumbLambda';
  const code = lambda.Code.fromAsset(functionPath)
  const lambdaFunction = new lambda.Function(this, logicalName, {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: code,
    environment: {
      DEST_BUCKET_NAME: bucketName,
      FOLDER_INPUT: folderIntput,
      FOLDER_OUTPUT: folderOutput,
      PROCESS_WIDTH: '512',
      PROCESS_HEIGHT: '512'
    }
  });
  return lambdaFunction;tea
}
```

in "aws/lambda/process-images" we:
1. create a handle for the lambda to executes when triggered
```js
const process = require('process');
const { getClient, getOriginalImage, processImage, uploadProcessedImage } = require('./s3-image-processing.js')

const bucketName = process.env.DEST_BUCKET_NAME
const folderInput = process.env.FOLDER_INPUT
const folderOutput = process.env.FOLDER_OUTPUT
const width = parseInt(process.env.PROCESS_WIDTH)
const height = parseInt(process.env.PROCESS_HEIGHT)

client = getClient();

exports.handler = async (event) => {
    console.log('event', event)

    const srcBucket = event.Records[0].s3.bucket.name;
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    console.log('srcBucket', srcBucket)
    console.log('srcKey', srcKey)

    const dstBucket = bucketName;
    const dstKey = srcKey.replace(folderInput, folderOutput)
    console.log('dstBucket', dstBucket)
    console.log('dstKey', dstKey)

    const originalImage = await getOriginalImage(client, srcBucket, srcKey)
    const processedImage = await processImage(originalImage, width, height)
    await uploadProcessedImage(client, dstBucket, dstKey, processedImage)
};
```
2. create a file to process the images:
```js
const sharp = require('sharp');
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

function getClient() {
    const client = new S3Client();
    return client;
}

async function getOriginalImage(client, srcBucket, srcKey) {
    console.log('get==')
    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    console.log('params', params)
    const command = new GetObjectCommand(params);
    const response = await client.send(command);

    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return buffer;
}

async function processImage(image, width, height) {
    const processedImage = await sharp(image)
        .resize(width, height)
        .png()
        .toBuffer();
    return processedImage;
}

async function uploadProcessedImage(client, dstBucket, dstKey, image) {
    console.log('upload==')
    const params = {
        Bucket: dstBucket,
        Key: dstKey,
        Body: image,
        ContentType: 'image/png'
    };
    console.log('params', params)
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    console.log('repsonse', response);
    return response;
}

module.exports = {
    getClient: getClient,
    getOriginalImage: getOriginalImage,
    processImage: processImage,
    uploadProcessedImage: uploadProcessedImage
}
```
3. install 'sharp' npm packages
```bash
npm install --include=optional sharp
npm install --os=linux --cpu=x64 sharp
```


## Create S3 Event Notify to Lambda
```js
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

createS3NotifyToLambda(prefix: string, lambda: lambda.IFunction, bucket: s3.IBucket): void {
  bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED_PUT,
    new s3n.LambdaDestination(lambda),
    {
      prefix: prefix, // original folder image
    }
  );
}
```
This will trigger the lambda function when a PUT event occur in the folder specified by the filter "prefix".

## Create policy for Bucket Access
```js
import * as iam from 'aws-cdk-lib/aws-iam';

const s3ReadWritePolicy = this.createPolicyBucketAccess(bucket.bucketArn)

lambdaFunction.addToRolePolicy(s3ReadWritePolicy);

createPolicyBucketAccess(bucketArn: string) {
    const s3ReadWritePolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`${bucketArn}/*`],
    });
    return s3ReadWritePolicy;
  }
```

## Create SNS Topic
```js
import * as sns from 'aws-cdk-lib/aws-sns';

const snsTopic = this.createSnsTopic(topicName)

createSnsTopic(topicName: string): sns.ITopic{
  const logicalName = "Topic";
  const snsTopic = new sns.Topic(this, logicalName, {
    topicName: topicName
  });
  return snsTopic;
}
```

## Create SNS Subscription
```js
import * as subscriptions from 'aws-cdk-lib/aws-s3-subscriptions';

this.createSnsSubscription(snsTopic,webhookUrl)

createSnsSubscription(snsTopic: sns.ITopic, webhookUrl: string): sns.Subscription {
  const snsSubscription = snsTopic.addSubscription(
    new subscriptions.UrlSubscription(webhookUrl)
  )
  return snsSubscription;
}
```

## Create Event Notification to SNS
```js
this.createS3NotifyToSns(folderOutput,snsTopic,bucket)

createS3NotifyToSns(prefix: string, snsTopic: sns.ITopic, bucket: s3.IBucket): void {
  const destination = new s3n.SnsDestination(snsTopic)
  bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED_PUT, 
    destination,
    {prefix: prefix}
  );
}
```

## Create policy for SNS Notification
```js
import * as iam from 'aws-cdk-lib/aws-iam';

const snsPublishPolicy = this.createPolicySnSPublish(snsTopic.topicArn)

lambdaFunction.addToRolePolicy(snsPublishPolicy);

createPolicySnSPublish(topicArn: string) {
  const snsPublishPolicy = new iam.PolicyStatement({
    actions: ['sns:Publish'],
    resources: [topicArn],
  });
  return snsPublishPolicy;
}
```



### Steps to provision resources:

1. define the resources required in the "*-stacks.ts" file
2. execute ```cdk bootstrap aws://<account-id>/<aws-region>``` to prepare the AWS environment for usage with the AWS Cloud Development Kit (AWS CDK)
3. execute ```cdk synth``` to catch any errors before deploying
4. execute ```cdk deploy``` to provision on CloudFormation


## Cloud Front

In order to serve the images from the S3 bucket, we can use CloudFront to cache the images and serve them faster.

Setup CloudFront:
1. Navigate to CloudFront and click "create distribution"
2. Choose an origin domain name (S3 bucket)
3. Name -> leave as default (auto populated)
4. Origin Access -> Origin Access Control Settings -> create a new OAC and select it from the dropdown menu
5. Viewer protocol policy -> "Redirect HTTP to HTTPS"
6. Cache key and origin requests -> Cache policy and origin request policy (recommended)
   1. Cache policy -> Caching Optimized
   2. Origin request policy -> CORS-S3Origin
7. Response headers policy -> SimpleCORS
8. Alternate domain name -> set as desired
9. Custom SSL certificate -> create a cert in the specified region and select it from the dropdown
10. click "create distribution"
11. as last step we should update the bucket policy as prompted by CloudFront
12. finally, we can access the images of the bucket by using the following url:
   ```
   https://<cloudfront-domain-name>/<bucket-object-path>
   ```


#### Make some changes to the buckets 

Instead of having 1 bucket with 2 folders (input and output), 
we can create 2 buckets, one for input (where user uploads images) 
and one for output (where cloud-front serves images from). 
This way we can have different policies for each bucket.

So the flow becomes:
1. user uploads an image on the input bucket
2. the lambda gets triggered and process the image, by resizing it and converting it to PNG, then uploads it to the output bucket
3. Cloud Front is set to serve the images from the output bucket


## Upload images to S3

To upload images to S3 we will make use of signed URLs.

1. **Create a Lambda function that generates a signed URL**
   1. name -> "CruddurAvatarUpload"
   2. runtime -> Ruby 3.3
   3. architecture -> x86_64
   4. execution role -> create a new role 
2. **Inside our code create the file that will handle the image upload**
   1. inside aws/lambda create a new folder ('cruddur-avatar-upload')
   2. create "UPLOADS_BUCKET_NAME" in the env variables
   3. create 'function.rb' file
      ```rb
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
      ```
   4. run ```bundle init``` to create a Gemfile
   5. run ```bundle config set --local path 'vendor/bundle' && bundle install``` to install the required gems
   6. zip the content of the folder "cruddur-avatar-upload" and upload it to the lambda function "CruddurAvatarUpload" ```zip -r cruddur-avatar-upload.zip function.rb vendor```
   7. set "FRONTEND_URL" and "UPLOADS_BUCKET_NAME" in the lambda env variables
   8. modify lambda execution role permissions using the policy on path "aws/lambda/policies/s3-upload-avatar-pre-sign-url-policy.json"
3. **Create a new Lambda for Authorizer**
   1. create "lambda-authorizer" folder under "aws/lambda"
   2. create index.js file with the following content
      ```js
         "use strict";

         const { CognitoJwtVerifier } = require("aws-jwt-verify");
         
         const jwtVerifier = CognitoJwtVerifier.create({
         userPoolId: process.env.USER_POOL_ID,
         tokenUse: "access",
         clientId: process.env.CLIENT_ID
         });
         
         exports.handler = async (event) => {
         console.log("request:", JSON.stringify(event, undefined, 2));
         
             const jwt = event.headers.authorization;
             try {
                 const payload = await jwtVerifier.verify(jwt);
                 console.log("Access allowed. JWT payload:", payload);
             } catch (err) {
                 console.error("Access forbidden:", err);
                 return {
                     isAuthorized: false,
                 };
             }
             return {
                 isAuthorized: true,
             };
         };
      ```
   3. run ```npm i aws-jwt-verify --save``` to create a package.json file
   4. zip the content of the folder "lambda-authorizer" and upload it to the lambda function "cruddurApiGatewayLambdaAuthorizer" ```zip -r lambda-authorizer.zip .```
4. **Create APIGateway**
   1. create a new API
   2. for integration choose the "CruddurAvatarUpload" lambda
   3. change the resource path to "/avatar/get_upload" and the method to "POST"
   4. once the API is created, go to the "Authorization" page, on the left side, and create a new authorizer of type lambda
   5. select the "cruddurApiGatewayLambdaAuthorizer" lambda function created previously
   6. once the authorizer is created, go back to the "Routes" page, select the "POST" route and attach the authorizer
   7. create a new route -> "/{proxy+}" (OPTIONS) and attach the integration previously created
   8. go to CORS and setup as follows: 
      1. "Access-Control-Allow-Origin" -> "*" (temporary, in the future it should use the frontend URL)
      2. "Access-Control-Allow-Headers" -> "content-type, authorization"
      3. "Access-Control-Allow-Methods" -> "OPTIONS,POST"
5. **Add a Cross-Origin Resource Sharing to "uploads" bucket**
   ```json
   [
      {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["PUT"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": [
         "x-amx-server-side-encryption",
         "x-amz-request-id",
         "x-amz-id-2"
         ],
         "MaxAgeSeconds": 30000
      }
   ]
   ```