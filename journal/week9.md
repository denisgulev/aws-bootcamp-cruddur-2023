# Week 9 — CI/CD with CodePipeline, CodeBuild and CodeDeploy

## CodePipeline

To create a new Pipeline, follow these steps:
1. give it a name
2. choose "New service role"
3. click "Next"
4. choose "Source provider" (e.g. GitHub)
5. choose Github (via GithubApp)
6. create a connection to github repository
7. select the repository and branch (create a new branch "prod")
8. for output artifact format -> leave the default
9. check "Start pipeline on push and pull request events"
10. skip build stage (we'll see it later on)
11. skip tests stage (we'll see later on)
12. deploy state -> select Amazon ECS for the provider
    1. choose the cluster
    2. choose the service
    3. click "Next"
13. click "Create pipeline"
14. At first it will fail, because we haven't created the build stage yet
15. click "Edit" and add a "Build" stage between "Source" and "Deploy"
16. go and create a "CodeBuild" project
    1. add a source from Github
    2. choose the repository and branch
    3. make sure to 
    4. make sure to NOT choose a VPC and subnets, otherwise it will not be able to communicate with github
    5. in the environment section
       1. check "Privileged - Enable this flag if you want to build Docker images or want your builds to get elevated privileges"
       2. choose "Ubuntu" for OS (support for docker builds)
       3. runtime -> standard
       4. images -> latest available
       5. compute -> minimum available
    6. create a "buildspec.yaml" file in the backend folder
    7. attach "codebuild-to-ecr-policy.json" to codebuild role
    8. **for MAC users** 
       1. the python:3.10-slim should use the architecture `linux/amd64` instead of `linux/arm64`