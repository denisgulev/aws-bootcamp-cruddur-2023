# Week 11 — Make Sure everything works with CloudFormation templates

### Serve the static website from an S3 bucket
   1. run the build command to create the static files
   2. upload the files to the S3 bucket
   3. go to CloudFront -> Distributions -> **choose the distribution** -> Origins -> select the existing origin
      1. Make sure the Origin Domain Name is NOT using the generic S3 URL (s3.amazonaws.com) but instead uses the regional S3 endpoint (s3.<your-region>.amazonaws.com).
      2. Change origin access to OAC (Origin Access Control) and create a new OAC
      3. Copy the policy prompted and paste it in the bucket policy
      4. Save changes and wait a couple of minutes for the changes to take effect
   4. Create a Github action to deploy static content to S3
      1. Create a new IAM user with programmatic access
         ```
         {
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject",
          "cloudfront:CreateInvalidation"
         }
         ```
      2. Save the credentials and add them to the Github secrets
         ```
            AWS_ACCESS_KEY_ID
            AWS_CLOUDFRONT_DIST_ID
            AWS_REGION
            AWS_SECRET_ACCESS_KEY
            AWS_USER_POOL_APP_CLIENT_ID
            AWS_USER_POOL_ID
            S3_BUCKET_NAME
         ```
      3. Create a new Github action to deploy the static content to S3, this will be triggered when changes are pushed in the "frontend-react-js" on `prod` branch
         ```yaml
            name: Build and Deploy Static Website to S3

            on:
              push:
                branches:
                  - prod
                paths:
                  - "frontend-react-js/**"  # Trigger only when files in this folder change
         
            jobs:
              deploy:
                runs-on: ubuntu-latest
         
                steps:
                    - name: Checkout Code
                      uses: actions/checkout@v4
            
                    - name: Set Up Node.js
                      uses: actions/setup-node@v4
                      with:
                        node-version: 18  # Adjust based on your project
            
                    - name: Install Dependencies
                      run: |
                        cd frontend-react-js
                        npm install
            
                    - name: Disable CI checks
                      run: echo "CI=false" >> $GITHUB_ENV
            
                    - name: Build the Website
                      run: |
                        cd frontend-react-js
                        npm run build  -- \
                          --REACT_APP_BACKEND_URL="https://api.denisgulev.com" \
                          --REACT_APP_FRONTEND_URL: "http://cruddur.denisgulev.com" \
                          --REACT_APP_AWS_PROJECT_REGION="${{ secrets.AWS_REGION }}" \
                          --REACT_APP_AWS_COGNITO_REGION="${{ secrets.AWS_REGION }}" \
                          --REACT_APP_AWS_USER_POOLS_ID="${{ secrets.AWS_USER_POOL_ID }}" \
                          --REACT_APP_CLIENT_ID="${{ secrets.AWS_USER_POOL_APP_CLIENT_ID }}"
            
                    - name: Configure AWS CLI
                      run: |
                        aws configure set aws_access_key_id ${{ secrets.AWS_ACCESS_KEY_ID }}
                        aws configure set aws_secret_access_key ${{ secrets.AWS_SECRET_ACCESS_KEY }}
                        aws configure set region ${{ secrets.AWS_REGION }}
            
                    - name: Deploy to S3
                      run: |
                        aws s3 sync frontend-react-js/build/ s3://${{ secrets.S3_BUCKET_NAME }}/ --delete
            
                    - name: Invalidate CloudFront Cache
                      run: |
                        aws cloudfront create-invalidation --distribution-id ${{ secrets.AWS_CLOUDFRONT_DIST_ID }} --paths "/*"
                      env:
                        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
                        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
                        AWS_REGION: ${{ secrets.AWS_REGION }}
            
                    - name: Delete Build Folder
                      run: rm -rf frontend-react-js/build
           ```
                  
         ** Note the step `- name: Disable CI checks` is necessary to prevent actions from error out on warnings.

### Reconnect RDS and Post Confirmation Lambda
1. adjust CLUSTER_NAME inside `force-deploy-backend-flask` script
2. use the correct security group for the RDS instance -> run `update-sg-rule` script
3. update `PROD_CONNECTION_URL` env variable with the update RDS endpoint
4. add `CustomErrorResponses` in the Distribution cloudformation template and execute the changeset
5. navigate to `cruddur-post-confirmation` lambda -> Configuration -> Environment variables -> update `CONNECTION_URL` with the new RDS endpoint and `RDS_HOST`
6. also in the lambda -> set VPC to use `CrdNet` VPC and create a new SG for the lambda
7. create an inbound rule on the RDS SG to allow traffic from the lambda SG

### Adjust CodePipeline
1. adjust `buildspec.yml` path, need to specify the path from the root directory
2. add permission to operate on S3 bucket, ECS and Codebuild for the CodePipelineRole

### Code Refactoring
1. create a decorator for jwt token validation
2. move routes in separate files