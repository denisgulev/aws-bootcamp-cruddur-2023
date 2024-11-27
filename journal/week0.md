# Week 0 — Billing and Architecture

## Install AWS CLI
- Get the instructions from official AWS cli configuration page
- 

## Create new User and generate credentials
- create new user with enabled console access
- create new 'Admin' group and apply 'AdministratorAccess' policy
- set an appropriate 'alias' from IAM -> Dashboard
- create 'Access key' (once logged in with the new user) and download it as .csv file
- run this command to configure "credentials" file on your computer
```
aws configure import --csv file://credentials.csv
```
- modify "~/.aws/credentials": modify [username] to [default]
- verify aws user identity:
```
aws sts get-caller-identity
```

## Create an AWS Budget
- explore documentation for `aws budgets create-budget`
- update json files in /aws directory
- run
```
aws budgets create-budget \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --budget file://aws/json/budget.json \
    --notifications-with-subscribers file://aws/json/budget-notifications-with-subscribers.json
```

## Create a Billing Alarm
### Create the topic
- explore documentation for `aws sns create-topic`
- create topic:
```
aws sns create-topic --name billing-alarm
```
- the above command return a 'topic ARN', which we will use in the following command:
```
aws sns subscribe \
    --topic-arn $(aws sns list-topics --query "Topics[].TopicArn" --output text) \
    --protocol email \
    --notification-endpoint <email>
```
- the subscription needs confirmation by the user -> 
    - go to your mail provider
    - confirm the subscription

### Create the alarm
- explore documentation for `aws cloudwatch put-metric-alarm`
- follow these instructions to create an alarm using a .json file - [GUIDE](https://aws.amazon.com/premiumsupport/knowledge-center/cloudwatch-estimatedcharges-alarm/)
- finally execute the following command:
```
aws cloudwatch put-metric-alarm --cli-input-json file://aws/json/alarm_config.json
```

## Lucid Charts
### Conceptual Diagram
![Cruddur - Conceptual Diagram](https://github.com/denisgulev/aws-bootcamp-cruddur-2023/assets/22997490/c63bfd54-dfe6-4599-b7e8-56d624a20b2b)
- [Link](https://lucid.app/lucidchart/2dc0978c-ed7b-4cbc-a813-ded241cc0350/edit?viewport_loc=-848%2C-307%2C2627%2C1343%2C0_0&invitationId=inv_251bde7a-e611-42ab-ab0b-283b5f73fb88)
### Logical Diagram
![Cruddur - Logical Diagram](https://github.com/denisgulev/aws-bootcamp-cruddur-2023/assets/22997490/cb7f8d7d-256b-492c-ab0f-ecd0e827a63d)
- [Link](https://lucid.app/lucidchart/37758524-e6e1-4ea1-b6fe-cf8cfdb1566a/edit?viewport_loc=328%2C211%2C1594%2C815%2C0_0&invitationId=inv_ad7290e9-6939-4967-b62c-9f179ca754a1)


## Other Stuff
### Alter GitHub repository's history
[BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) comes in handy to modify commits' history, by removing/replacing some secret credentials we do not want to be public.
