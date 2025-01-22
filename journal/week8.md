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