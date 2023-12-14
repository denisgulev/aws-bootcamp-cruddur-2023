# Week 0 — Billing and Architecture

### Install AWS CLI
- Get the instructions from official AWS cli configuration page
- Gitpod need a configuration file to install everytime the AWS cli, so we update the `.gitpod.yml` as follows:

```sh
tasks:
  - name: aws-cli
    env:
      AWS_CLI_AUTO_PROMPT: on-partial
    init: |
      cd /workspace
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
      unzip awscliv2.zip
      sudo ./aws/install
      cd $THEIA_WORKSPACE_ROOT
```

### Create new User and generate credentials
- create new user with enabled console access
- create new 'Admin' group and apply 'AdministratorAccess' policy
- set an appropriate 'alias' from IAM -> Dashboard
- create 'Access key'

### Set Env Vars
Set env for current bash window:
```
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_DEFAULT_REGION=eu-central-1
```

Tell gitpod to keep track in user's account:
```
gp env AWS_ACCESS_KEY_ID=""
gp env AWS_SECRET_ACCESS_KEY=""
gp env AWS_DEFAULT_REGION=eu-central-1
```

Finally, test **aws cli** is working:
```
aws sts get-caller-identity
```

### Create an AWS Budget
- explore documentation for `aws budgets create-budget`
- update json files in /aws directory
- launch:
```
aws budgets create-budget \
    --account-id <AccountID> \
    --budget file://aws/json/budget.json \
    --notifications-with-subscribers file://aws/json/budget-notifications-with-subscribers.json
```

### Create a Billing Alarm
#### Create the topic
- explore documentation for `aws sns create-topic`
- create topic:
```
aws sns create-topic --name billing-alarm
```
- the above command return a 'topic ARN', which we will use in the following command:
```
aws sns subscribe \
    --topic-arn <topic-arn> \
    --protocol email \
    --notification-endpoint <email>
```

#### Create the alarm
- explore documentation for `aws cloudwatch put-metric-alarm`
- follow these instructions to create an alarm using a .json file - [GUIDE](https://aws.amazon.com/premiumsupport/knowledge-center/cloudwatch-estimatedcharges-alarm/)
- finally execute the following command:
```
aws cloudwatch put-metric-alarm --cli-input-json file://aws/json/alarm_config.json
```
