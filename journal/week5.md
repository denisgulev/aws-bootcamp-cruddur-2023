# Week 5 — DynamoDB and Serverless Caching

## Walkthrough create a DynamoDB instance

1. go into the region you have your application
2. click "Create table"
   1. Table Name -> name of the table
   2. Partition Key -> indicates a part of the primary key
   3. Sort Key -> this is an optional second part of the primary key
   4. Default table setting ->
      1. Read Capacity -> how much we are charged for read operations
      2. Write Capacity -> how much we are charged for write operations
      3. Delete Protection -> turned on for prod env
   5. Tags -> assign tags to resources, in order to facilitate access control and other AWS metrics
3. once the table is created, we can add items to it or use the service's endpoint to interact with it


## Best Practices
DynamoDB is universal for an account, the url is the same across the account.
What differs is the table you are trying to access.

** To access DynamoDB you should make use of **VPC/Gateway Endpoint**,
so that each data access request from an EC2 instance is routed to a VPC endpoint within AWS,
i.e. does not need to go out to the internet and then go back to DynamoDB.

#### Amazon Side
1. Use VPC Endpoint, to communicate with DynamoDB without leaving the safe AWS area
2. Compliance standards
3. DynamoDB should reside in the region we are "legally allowed" to hold user data
4. use Amazon SCPs to help manage DynamoDB operations (delete, create, region lock, etc...)

#### Application Client Side
1. use encryption if we are using DynamoDB to store sensitive information -> IAM Roles / Cognito Identity Pool
2. DO NOT access DynamoDB from the internet, make use of VPC Endpoints

---

We want to use DynamoDB to handle direct messages between users.
In NoSQL we want to structure our data based on the access patterns we need to support. (i.e. how our application will use this data)

We want:
1. a group of "CONVERSATION" objects that represent a set of message between two users; on the UI, each conversation will display "USER_NAME" of the user i am talking to, "LAST_MESSAGE" of the conversation and the "TIME" of the last reply
2. a conversation object will contain a group of "MESSAGE" objects, represented by "DISPLAY_NAME" of the user who sent the message, "CONTENT" of the message and "TIME" of the message

### Access Pattern A
We need to retrieve the messages of a conversation, sorted by "TIME" in descending order.
These table will have a "Partition Key" of "CONVERSATION_ID" and a "Sort Key" of "TIME".

** In general, as Partition Key we should consider what data we do have on hand to go and get the data we need. (We do not have to use UUIDs everytime) **

### Access Pattern B
We want to see a list of all previous conversations. 
They are listed from newest to oldest (DESC). Want to see the other person we are talking to. 
We want to see the last message (from whomever) in summary.

### Pattern C - Create a Message
Whenever we create a new message, this will create in response a new Conversation or update an existing one.

### Installing Dynamodb
1. add "boto3" to dependencies of the server
2. 