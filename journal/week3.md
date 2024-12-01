# Week 3 — Decentralized Authentication

#### SAML
- Security Association Markup Language -> 
allows us to have a single point of entry in any application

#### OpenID Connect
- handles just authentication -> allows us to use our social media accounts to log in to any application

#### OAuth
- handles authorization

### Amazon Cognito

Allows authentication with users stored in amazon account.

1. Cognito User Pool
   1. allows for new registrations
   2. allows for authentication with already existing accounts on other platforms
2. Cognito Identity Pool
   1. creates temporary credentials for users
   2. allows for access to AWS resources

---

Walkthrough of the AWS Cognito service

2 choices:
1. add user directories to existing applications
2. grant access to AWS resources

Why?
1. use directory for customers
2. ability to access AWS Resources for the app
3. identity broker for temporary credentials
4. can extend users to AWS Resources

#### User Lifecycle

1. employee joins
2. IT profile creation
3. assign basic authorization
4. additional app authorization requests
5. employee departs
6. off-board

--> translates to:

1. new employee
2. provision
3. enforce policies
4. update policies (based on role)
5. departs
6. off-board

#### Token lifecycle

Tokens gives access to certain resources.
A user is authenticated, thus it has an access token and the application verifies that the user 
has access to the requested resources.

#### Best Practices

1. On AWS services
   1. AWS services -> make use of user's role of the access token to limit access to services
   2. AWS WAF -> web access firewall (rate limiting, allow/deny list, deny access from regions, etc.)
   3. Cognito should be compliance required as per business requirements
   4. Cognito should be used in the region where the business has the legal right to hold user's information
   5. add AWS Cloudtrail to monitor suspicious behaviour by identities on AWS (adding new user pool or delete existing one, add user more permissions, etc.)
2. On the application
   1. use encrypt connections
   2. use industry standards (SAML, OpenID Connect, OAuth 2.0)
   3. handle user lifecycle (create, update, delete, change roles)
   4. token lifecycle management (create, revoke, refresh)
   5. JWT token best practice (no sensitive information stored)

---

## Provision Cognito User Group

Using the AWS Console we'll create a Cognito User Group

## Install AWS Amplify

Tool to be used client-side to integrate AWS Cognito.

```sh
npm i aws-amplify --save
```

## Configure Amplify

We need to hook up our cognito pool to our code in the `App.js`.
Add all env variables to the docker-compose file under the frontend service.

```js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  "AWS_PROJECT_REGION": process.env.REACT_APP_AWS_PROJECT_REGION,
  "aws_cognito_region": process.env.REACT_APP_AWS_COGNITO_REGION,
  "aws_user_pools_id": process.env.REACT_APP_AWS_USER_POOLS_ID,
  "aws_user_pools_web_client_id": process.env.REACT_APP_CLIENT_ID,
  "oauth": {},
  Auth: {
    // We are not using an Identity Pool
    // identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID, // REQUIRED - Amazon Cognito Identity Pool ID
    region: process.env.REACT_APP_AWS_PROJECT_REGION,           // REQUIRED - Amazon Cognito Region
    userPoolId: process.env.REACT_APP_AWS_USER_POOLS_ID,         // OPTIONAL - Amazon Cognito User Pool ID
    userPoolWebClientId: process.env.REACT_APP_AWS_USER_POOLS_WEB_CLIENT_ID,   // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
  }
});
```