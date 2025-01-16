# Week 6 — Deploying Containers

## ECS Security Best Practices

Containers in AWS can be deployed either by using VMs or any ECS managed service by AWS.

1. choose an ECR repository
   1. visibility PRIVATE (secure), PUBLIC (open)
   2. repository-name
   3. tag-immutability -> ON == prevent images with the same tag to be pushed
   4. image-scan -> ON == auto scans each successfully pushed image
   5. encryption -> ON == additional security
2. enables ECT Scan Images
3. use VPC endpoints or security groups
4. use Amazon Organizations SCPs

---

## Defaults
   ```sh
      export DEFAULT_VPC_ID=$(aws ec2 describe-vpcs \
         --filters "Name=isDefault, Values=true" \
         --query "Vpcs[0].VpcId" \
         --output text)
      echo $DEFAULT_VPC_ID
   ```
   ```sh
      export DEFAULT_SUBNET_IDS=$(aws ec2 describe-subnets  \
          --filters Name=vpc-id,Values=$DEFAULT_VPC_ID \
          --query 'Subnets[*].SubnetId' \
          --output json | jq -r 'join(",")')
      echo $DEFAULT_SUBNET_IDS
   ```

## Health Checks

Health check is used to determine if a service is healthy or not.
There could be one at load balancer level, at container level or any service.

We need to define a health check for our RDS instance.

1. create a test script inside bin/db folder
   ```python
      #! /usr/bin/python3

      import psycopg
      import os
      
      connection_url = os.getenv("CONNECTION_URL")
      
      conn = None
      try:
         print('attempting connection')
         conn = psycopg.connect(connection_url)
         print("Connection successful!")
      except psycopg.Error as e:
        print("Unable to connect to the database:", e)
      finally:
        conn.close()
   ```
2. run the "update-sg-rule" script to update the IP for our sg
3. run the "test" script to verify RDS instance is up and running

## Flask Task Script

1. add this endpoint to app.py
   ```python
      @app.route('/api/health-check')
      def health_check():
        return {'success': True}, 200
   ```
2. create a "bin/flask/health-check" script
   ```python
        #!/usr/bin/env python3

        import urllib.request

        try:
            response = urllib.request.urlopen('http://localhost:4567/api/health-check')
            if response.getcode() == 200:
                print("Flask server is running")
                exit(0) # success
            else:
                print("Flask server is not running")
                exit(1) # failure
        except Exception as e:
            print(e)
            exit(1)
   ```
   
## Create CloudWatch Log Group
```sh
   aws logs create-log-group --log-group-name "cruddur"
   aws logs put-retention-policy --log-group-name "cruddur" --retention-in-days 1
```

## Create ECS Cluster
```sh
   aws ecs create-cluster \
      --cluster-name cruddur \
      --service-connect-defaults namespace=cruddur
```

## AWS ECR Repository and ImagePush
### Repository for base Python Image
1. create the repository
   ```sh
      aws ecr create-repository \
        --repository-name cruddur-python \
        --image-tag-mutability MUTABLE
   ```
2. login to ECR
   ```sh
      aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"    ```
   ```
3. set ECR URL
   ```sh
      export ECR_PYTHON_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/cruddur-python"
      echo $ECR_PYTHON_URL
   ```
4. Pull Image
   ```sh
     docker pull python:3.10-slim
   ```
5. Tag Image
   ```sh
     docker tag python:3.10-slim $ECR_PYTHON_URL:3.10-slim
   ```
6. Push Image
   ```sh
     docker push $ECR_PYTHON_URL:3.10-slim
   ```
7. Update the dockerfile
   ```
      # from this
      FROM python:3.10-slim
      # to this
      FROM <$AWS_ACCOUNT_ID>.dkr.ecr.<$AWS_DEFAULT_REGION>.amazonaws.com/cruddur-python:3.10-slim
   ```

### Repository for Flask Image
1. create the repository
   ```sh
      aws ecr create-repository \
        --repository-name cruddur-flask \
        --image-tag-mutability MUTABLE
   ```
2. login to ECR
   ```sh
      aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
   ```
3. set ECR URL
   ```sh
      export ECR_BACKEND_FLASK_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/cruddur-flask"
      echo $ECR_BACKEND_FLASK_URL
   ```
4. Build Image
   ```sh
     docker build -f Dockerfile.prod -t backend-flask-prod .
   ```
5. Tag Image
   ```sh
     docker tag backend-flask-prod:latest $ECR_BACKEND_FLASK_URL:latest
   ```
6. Push Image
   ```sh
     docker push $ECR_BACKEND_FLASK_URL:latest
   ```


### Repository for Frontend
1. create the repository
   ```sh
      aws ecr create-repository \
        --repository-name frontend-react-js \
        --image-tag-mutability MUTABLE
   ```
2. login to ECR
   ```sh
      aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
   ```
3. set ECR URL
   ```sh
      export ECR_FRONTEND_REACT_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/frontend-react-js"
      echo $ECR_FRONTEND_REACT_URL
   ```
4. Build Image
   ```sh
     docker build \
      --build-arg REACT_APP_BACKEND_URL="http://cruddur-alb-284804859.eu-south-1.elb.amazonaws.com:4567" \
      --build-arg REACT_APP_AWS_PROJECT_REGION="$AWS_DEFAULT_REGION" \
      --build-arg REACT_APP_AWS_COGNITO_REGION="$AWS_DEFAULT_REGION" \
      --build-arg REACT_APP_AWS_USER_POOLS_ID="$AWS_USER_POOL_ID" \
      --build-arg REACT_APP_CLIENT_ID="$AWS_USER_POOL_APP_CLIENT_ID" \
      -t frontend-react-js \
      -f Dockerfile.prod \
      .
   ```
5. Tag Image
   ```sh
     docker tag frontend-react-js:latest $ECR_FRONTEND_REACT_URL:latest
   ```
6. Push Image
   ```sh
     docker push $ECR_FRONTEND_REACT_URL:latest
   ```

## Run ECS Service
In order to create an ECS service, we need to create a task definition and a service.

### Task Definition
This is like a "Dockerfile", that specifies how to provision our application.

1. Create Systems Manager -> Parameter Store -> Parameters
    ```sh
         aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_ACCESS_KEY_ID" --value $AWS_ACCESS_KEY_ID
         aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_SECRET_ACCESS_KEY" --value $AWS_SECRET_ACCESS_KEY
         aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/CONNECTION_URL" --value $PROD_CONNECTION_URL
         aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/ROLLBAR_ACCESS_TOKEN" --value $ROLLBAR_ACCESS_TOKEN
         aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/OTEL_EXPORTER_OTLP_HEADERS" --value "x-honeycomb-team=$HONEYCOMB_API_KEY"
    ```
2. Create Task and Execution Roles for Task Definition
   ```sh
      aws iam create-role \
         --role-name CruddurServiceExecutionRole \
         --assume-role-policy-document file://aws/policies/service-assume-role-execution-policy.json
   ```
   ```sh
      aws iam put-role-policy \
         --policy-name CruddurServiceExecutionPolicy \
         --role-name CruddurServiceExecutionRole \
         --policy-document file://aws/policies/service-execution-policy.json
   ```
   ```sh
      aws iam attach-role-policy --policy-arn $POLICY_ARN --role-name CruddurServiceExecutionRole
   ```

3. create a task role (create role, create policy)
   ```sh
      aws iam create-role \
            --role-name CruddurTaskRole \
            --assume-role-policy-document "{
         \"Version\":\"2012-10-17\",
         \"Statement\":[{
         \"Action\":[\"sts:AssumeRole\"],
         \"Effect\":\"Allow\",
         \"Principal\":{
         \"Service\":[\"ecs-tasks.amazonaws.com\"]
         }
         }]
         }"
            
      aws iam put-role-policy \
         --policy-name SSMAccessPolicy \
         --role-name CruddurTaskRole \
         --policy-document "{
         \"Version\":\"2012-10-17\",
         \"Statement\":[{
         \"Action\":[
         \"ssmmessages:CreateControlChannel\",
         \"ssmmessages:CreateDataChannel\",
         \"ssmmessages:OpenControlChannel\",
         \"ssmmessages:OpenDataChannel\"
         ],
         \"Effect\":\"Allow\",
         \"Resource\":\"*\"
         }]
         }
         "
            
         aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess --role-name CruddurTaskRole
         aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess --role-name CruddurTaskRole
   ```
4. Register Task Definition -> 
   create backend-flask.json file
   ```json
      {
         "family": "backend-flask",
         "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/CruddurServiceExecutionRole",
         "taskRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/CruddurTaskRole",
         "networkMode": "awsvpc",
         "cpu": "256",
         "memory": "512",
         "requiresCompatibilities": [
          "FARGATE"
         ],
         "runtimePlatform": {
            "cpuArchitecture": "ARM64",
            "operatingSystemFamily": "LINUX"
         },
         "containerDefinitions": [
            {
               "name": "backend-flask",
               "image": "<ACCOUNT_ID>.dkr.ecr.eu-south-1.amazonaws.com/cruddur-flask:latest",
               "essential": true,
               "healthCheck": {
                 "command": [
                   "CMD-SHELL",
                   "python /backend-flask/bin/flask/health-check"
                 ],
                 "interval": 30,
                 "timeout": 5,
                 "retries": 3,
                 "startPeriod": 60
               },
               "portMappings": [
                  {
                     "name": "backend-flask",
                     "containerPort": 4567,
                     "protocol": "tcp",
                     "appProtocol": "http"
                  }
               ],
               "logConfiguration": {
                  "logDriver": "awslogs",
                  "options": {
                     "awslogs-group": "cruddur",
                     "awslogs-region": "<AWS_REGION>",
                     "awslogs-stream-prefix": "backend-flask"
                  }
               },
               "environment": [
                  {"name": "OTEL_SERVICE_NAME", "value": "backend-flask"},
                  {"name": "OTEL_EXPORTER_OTLP_ENDPOINT", "value": "https://api.honeycomb.io"},
                  {"name": "AWS_COGNITO_USER_POOL_ID", "value": "eu-south-1_0afCPtZ7H"},
                  {"name": "AWS_COGNITO_USER_POOL_CLIENT_ID", "value": "3njmudq5anl6q3maonbbt8f6uf"},
                  {"name": "FRONTEND_URL", "value": "*"},
                  {"name": "BACKEND_URL", "value": "*"},
                  {"name": "AWS_DEFAULT_REGION", "value": "<AWS_REGION>"}
               ],
               "secrets": [
                  {"name": "AWS_ACCESS_KEY_ID"    , "valueFrom": "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:parameter/cruddur/backend-flask/AWS_ACCESS_KEY_ID"},
                  {"name": "AWS_SECRET_ACCESS_KEY", "valueFrom": "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:parameter/cruddur/backend-flask/AWS_SECRET_ACCESS_KEY"},
                  {"name": "CONNECTION_URL"       , "valueFrom": "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:parameter/cruddur/backend-flask/CONNECTION_URL" },
                  {"name": "ROLLBAR_ACCESS_TOKEN" , "valueFrom": "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:parameter/cruddur/backend-flask/ROLLBAR_ACCESS_TOKEN" },
                  {"name": "OTEL_EXPORTER_OTLP_HEADERS" , "valueFrom": "arn:aws:ssm:<AWS_REGION>:<ACCOUNT_ID>:parameter/cruddur/backend-flask/OTEL_EXPORTER_OTLP_HEADERS" }
              ]
            }
         ]
      }
   ```
   create frontend-react.json file
   ```json
      {
         "family": "frontend-react-js",
         "executionRoleArn": "arn:aws:iam::923264624222:role/CruddurServiceExecutionRole",
         "taskRoleArn": "arn:aws:iam::923264624222:role/CruddurTaskRole",
         "networkMode": "awsvpc",
         "cpu": "256",
         "memory": "512",
         "requiresCompatibilities": [
            "FARGATE"
         ],
         "containerDefinitions": [
            {
               "name": "frontend-react-js",
               "image": "923264624222.dkr.ecr.eu-south-1.amazonaws.com/frontend-react-js",
               "essential": true,
               "healthCheck": {
                  "command": [
                  "CMD-SHELL",
                  "curl -f http://localhost:3000 || exit 1"
                  ],
                  "interval": 30,
                  "timeout": 5,
                  "retries": 3
               },
               "portMappings": [
                  {
                  "name": "frontend-react-js",
                  "containerPort": 3000,
                  "protocol": "tcp",
                  "appProtocol": "http"
                  }
               ],
               "logConfiguration": {
                 "logDriver": "awslogs",
                 "options": {
                   "awslogs-group": "cruddur",
                   "awslogs-region": "eu-south-1",
                   "awslogs-stream-prefix": "frontend-react-js"
                 }
               }
            }
         ]
      }
   ```
5. register the task
   ```sh
      aws ecs register-task-definition --cli-input-json file://aws/task-definitions/backend-flask.json
      aws ecs register-task-definition --cli-input-json file://aws/task-definitions/frontend-react-js.json
   ```
   
6. Create Security Group
   ```sh
      export CRUD_SERVICE_SG=$(aws ec2 create-security-group \
         --group-name "crud-srv-sg" \
         --description "Security group for Cruddur services on ECS" \
         --vpc-id $DEFAULT_VPC_ID \
         --query "GroupId" --output text)
         echo $CRUD_SERVICE_SG
   
      aws ec2 authorize-security-group-ingress \
         --group-id $CRUD_SERVICE_SG \
         --protocol tcp \
         --port 80 \
         --cidr 0.0.0.0/0
   ```
7. Create ECS Services
    ```sh
        aws ecs create-service --cli-input-json file://aws/json/service-backend-flask.json
        aws ecs create-service --cli-input-json file://aws/json/service-frontend-react-js.json
    ```
8. Install the session-manager to access the container from your PC
   - https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
   - Verify its working
   ```sh
      session-manager-plugin
   ```
   - Connect to the container
   ```sh
      aws ecs execute-command  \
         --region $AWS_DEFAULT_REGION \
         --cluster cruddur \
         --task <TASK_ID> \
         --container backend-flask \
         --command "/bin/bash" \
         --interactive
   ```
9. edit inbound rules of RDS's security group to allow traffic from the ECS security group
   - go to EC2
   - enter "security groups"
   - select the RDS security group
   - edit inbound rules
   - add a new rule -> select as source the ECS security group of ECS and give it a description for future identification
10. connect to the container and test the connection, using (./bin/deb/test)
