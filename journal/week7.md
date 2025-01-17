# Week 7 — Solving CORS with a Load Balancer and Custom Domain

## Create an ALB (Application Load Balancer)
1. navigate to EC2 -> Load Balancers
2. create a new ALB
3. create a new security group -> set inbound rules for HTTP and HTTPS from anywhere
4. edit "crud-srv-sg" security-groups to allow access ONLY through the load-balancer
5. use the newly created SG in the ALB
6. create a new target group
    - target type -> "IP Addresses"
    - port -> port of the service the load-balancer will route traffic to
7. create another target group for the FE

--> Once the ALB is created, we MUST adjust the creation of the service to use the ALB as a load balancer.

8. modify "service-backend-flask.json" by adding the field "loadBalancers"
9. run the "create-service" command again
10. once the service is up and healthy, we can access the application from the LoadBalancer DNS Name and NOT through task IP anymore
11. we can setup access-logs for the ALB inside the "Attributes" tab

## Prepare the Frontend for production

1. define a nginx.conf file to be used as reverse-proxy
2. define a Dockerfile for production build
3. follow steps under "Repository for Frontend"
4. register the task definition for the frontend
5. execute "create-service" command for the frontend

## Security Groups Adjustments

On the security-group connected with services, we should create inbound rules both for port 3000 and port 4567 and allowing traffic coming from the ALB.

## SSL and DomainName

On Route53 we can create a new domain name and connect it to the ALB.

If we already have a registered domain on another platform, we could make use of the NS from route53 and update the domain's NS to point to the route53 NS.
1. we create a hosted zone on route53
2. we update domain's NS to point to route53 NS
3. we create a new record set for the domain name to point to the ALB


To protect our application, we should enable SSL.
To do so, we can use ACM (Amazon Certificate Manager) to create a new certificate and attach it to the ALB.

1. navigate to certificate manager
2. "request a certificate"
3. public certificate
4. enter desired domain names
    1. example.com, *.example.com
5. validation method -> "DNS validation"
6. Key Algorithm -> default
7. click "create records in route 53"

Next

8. navigate to the ALB
9. create 2 listeners:
    1. 80 -> redirect -> 443
    2. 443 -> forward -> target group (frontend), MUST select the certificate created in ACM
    3. on the second listener we add a rule to forward traffic to the target group, on the condition that the host is the domain name (api.example.com) we want to use
10. navigate to Route53 and create
    1. a new record that will route traffic to the ALB, for a subdomain (app.example.com)
    2. a new record that will route traffic to the ALB, for a subdomain (api.example.com)
       (this will ensure that when we navigate to "https://app.example.com" we will be redirected to the frontend targetgroup &&
       when we navigate to "https://api.example.com" we will be redirected to the backend targetgroup) --> as per the rules we set on the ALB

-> Update task-definition for the backend by specifying the environment variables "FRONTEND_URL" and "BACKEND_URL" to be the domain name we want to use with "https" protocol

11. register-task-definition for the backend

NEXT

1. build frontend image and push it to ECR

   ```sh
     docker build \
      --build-arg REACT_APP_BACKEND_URL="https://api.denisgulev.com" \
      --build-arg REACT_APP_AWS_PROJECT_REGION="$AWS_DEFAULT_REGION" \
      --build-arg REACT_APP_AWS_COGNITO_REGION="$AWS_DEFAULT_REGION" \
      --build-arg REACT_APP_AWS_USER_POOLS_ID="$AWS_USER_POOL_ID" \
      --build-arg REACT_APP_CLIENT_ID="$AWS_USER_POOL_APP_CLIENT_ID" \
      -t frontend-react-js \
      -f Dockerfile.prod \
      .
   ```
2. navigate to ECS
3. update "backend" service to use the new task definition
4. update "frontend" service to use the latest pushed image

## Refresh Cognito Token

Update the "useAuth" function in the frontend app in order to allow for token refresh

```js
  import { useState, useEffect } from "react";
  import { fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";

  export async function setAccessToken() {
    const session = await fetchAuthSession({ forceRefresh: true });
    const { accessToken } = session.tokens ?? {};
    localStorage.setItem('access_token', accessToken);
  }

  export function useAuth() {
    const [user, setUser] = useState(null);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const attributes = await fetchUserAttributes();
          await setAccessToken();

          setUser({
            display_name: attributes.name,
            handle: attributes.preferred_username,
          });
        } catch (err) {
          console.error("Error fetching user attributes:", err);
        }
      };

      checkAuth();
    }, []);

    return { user };
  }
```

Also, call "setAccessToken()" everywhere we are using the token to make autheticated requests towards the BE.

## Fargate 

When deploying services using Fargate, we should size the CPU and Memory according to the CPU cycles we are using.
Fargate uses the shared responsibility model, where AWS is responsible for the underlying infrastructure (EC2s and their updates/patching) and we are responsible for the security of the application.

Service connect is an evolution of AppMesh and CloudMap to handle service discovery and routing.

Container insights are useful for monitoring the containers and the services running on ECS, it allows to track the communication 
between services and helps to identify bottlenecks.

## Fargate Container Insights

1. edit "aws/task-definitions/backend-flask.json" file, by adding ContainerDefinition for XRay
   ```json
      {
         "name": "xray",
         "image": "public.ecr.aws/xray/aws-xray-daemon",
         "essential": true,
         "user": "1337",
         "portMappings": [
          {
             "name": "xray",
             "containerPort": 2000,
             "protocol": "udp"
          }
         ],
         "healthCheck": {
             "command": [
                 "CMD-SHELL",
                 "pgrep xray || exit 1"
             ],
             "interval": 30,
             "timeout": 5,
             "retries": 3,
             "startPeriod": 60
         }
      }
   ```
2. update the task definition for the backend -> run ```./bin/ecs/register-backend-task``` followed by ```./bin/ecs/force-deploy-backend-flask```
3. wait for the task to run and in the AWS Console -> ECS -> Tasks -> (last run backend task) -> we should see 3 containers (xray, serviceConnect, backend-flask)
4. repeat step 1 to 3 for "aws/task-definitions/frontend-react-js.json"