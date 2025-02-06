# Week 10 — CloudFormation Part 1

We are going to define multiple layer cloudFormation templates, each containing specifications for particulare resources.

1. Define CloudFormation for ECS fargate
   1. create template for ECS resource
        ```
        AWSTemplateFormatVersion: 2010-09-09
        Description: |
        Setup ECS Cluster
        Resources:
        ECSCluster: # LogicalName
        Type: AWS::ECS::Cluster
        ```
   2. execute "backend-flask/bin/cfn/deploy" script
   3. go to AWS CloudFormation console and review the "changeset"
   4. if everything is ok, go ahead and execute it
   5. in case of errors, take a look at CloudTrail for more details
   6. we can validate the format of our template (json or yaml) using "validate-template" cli command
      or using "cfn-lint"
   7. we can store template in S3 and reference it in the CloudFormation template

    
We'll create multiple layers of CloudFormation templates, each containing specifications for particular resources.

1. Networking -> base networking layer where we deploy service into ("aws/cfn/networking/template.yaml")
   
   In a Template file:
   1. define a VPC resource
   2. define an IGW resource
   3. define a VPCGatewayAttachment resource
   4. define a RouteTable resource
   5. define 2 Routes resources
      1. 1 for the IGW
      2. 1 for the local VPC (setup by default when creating RouteTable)
   6. define Subnet resources
      1. 3 for public subnet
      2. 3 for private subnet
   7. define SubnetRouteTableAssociation resources for each subnet

![Networking Layer](_docs/assets/Networking-Layer.jpeg)


2. Cluster -> all cluster level resources
   1. we need to pass parameters for Certificates using "cfn-toml"
   see https://www.ruby-toolbox.com/projects/cfn-toml

![Cluster+Networking Layers](_docs/assets/Cluster-Networking-Layers.jpeg)
