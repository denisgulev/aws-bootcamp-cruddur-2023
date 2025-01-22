import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

dotenv.config();

export class ThumbingServerlessCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // define an S3 bucket to store the images
    const uploadsBucketName: string = process.env.UPLOADS_BUCKET_NAME as string;
    const assetsBucketName: string = process.env.ASSETS_BUCKET_NAME as string;
    const functionPath: string = process.env.THUMBING_FUNCTION_PATH as string;
    const folderInput: string = process.env.THUMBING_S3_FOLDER_INPUT as string;
    const folderOutput: string = process.env.THUMBING_S3_FOLDER_OUTPUT as string;
    const webhookUrl: string = process.env.THUMBING_WEBHOOK_URL as string;
    const topicName: string = process.env.THUMBING_TOPIC_NAME as string;
    console.log("uploadsBucketName: ", uploadsBucketName);
    console.log("assetsBucketName: ", assetsBucketName);
    console.log("functionPath: ", functionPath);
    console.log("folderInput: ", folderInput);
    console.log("folderOutput: ", folderOutput);
    console.log("webhookUrl: ", webhookUrl);
    console.log("topicName: ", topicName);

    // create buckets
    const uploadsBucket = this.createBucket(uploadsBucketName, 'ThumbUploadsBucket');
    const assetsBucket = this.createBucket(assetsBucketName, 'ThumbAssetsBucket');

    // create lambda function
    const lambdaFunction = this.createLambda(functionPath, assetsBucketName, uploadsBucketName, folderInput, folderOutput);

    // create SNS topic and subscription
    const snsTopic = this.createSnsTopic(topicName)
    this.createSnsSubscription(snsTopic, webhookUrl)

    // create S3 notification to lambda
    this.createS3NotifyToLambda(folderInput, lambdaFunction, uploadsBucket);
    this.createS3NotifyToSns(folderOutput, snsTopic, assetsBucket)

    // create policy to allow lambda to access the bucket and publish to SNS
    const s3UploadsReadWritePolicy = this.createPolicyBucketAccess(uploadsBucket.bucketArn)
    const s3AssetsReadWritePolicy = this.createPolicyBucketAccess(assetsBucket.bucketArn)
    // const snsPublishPolicy = this.createPolicySnSPublish(snsTopic.topicArn)

    // attach policies to lambda
    lambdaFunction.addToRolePolicy(s3UploadsReadWritePolicy);
    lambdaFunction.addToRolePolicy(s3AssetsReadWritePolicy);
    // lambdaFunction.addToRolePolicy(snsPublishPolicy);
  }

  createBucket(bucketName: string, logicalName: string): s3.IBucket {
    console.log("bucketName: ", bucketName);
    console.log("logicalName: ", logicalName);
    const bucket = new s3.Bucket(this, logicalName, {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    return bucket;
  }

  createLambda(functionPath: string, assetsBucketName: string, uploadsBucketName: string, folderInput: string, folderOutput: string): lambda.IFunction {
    const lambdaFunction = new lambda.Function(this, 'ThumbLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(functionPath), // specifies where we should load the lambda code from
      environment: {
        DEST_BUCKET_NAME: assetsBucketName,
        FOLDER_INPUT: folderInput,
        FOLDER_OUTPUT: folderOutput,
        PROCESS_WIDTH: '512',
        PROCESS_HEIGHT: '512',
        REGION: process.env.THUMBING_REGION as string,
      }
    });
    return lambdaFunction;
  }

  createS3NotifyToLambda(prefix: string, lambda: lambda.IFunction, bucket: s3.IBucket): void {
    const destination = new s3n.LambdaDestination(lambda);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      destination//,
      // {
      //   prefix: prefix, // original folder image
      // }
    );
  }

  createPolicyBucketAccess(bucketArn: string) {
    const s3ReadWritePolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`${bucketArn}/*`],
    });
    return s3ReadWritePolicy;
  }

  createSnsTopic(topicName: string): sns.ITopic {
    const logicalName = "Topic";
    const snsTopic = new sns.Topic(this, logicalName, {
      topicName: topicName
    });
    return snsTopic;
  }

  createSnsSubscription(snsTopic: sns.ITopic, webhookUrl: string): sns.Subscription {
    const snsSubscription = snsTopic.addSubscription(
      new subscriptions.UrlSubscription(webhookUrl)
    )
    return snsSubscription;
  }

  createS3NotifyToSns(prefix: string, snsTopic: sns.ITopic, bucket: s3.IBucket): void {
    const destination = new s3n.SnsDestination(snsTopic)
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      destination,
      { prefix: prefix }
    );
  }
  /*
    createPolicySnSPublish(topicArn: string) {
      const snsPublishPolicy = new iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: [topicArn],
      });
      return snsPublishPolicy;
    }
      */
}
