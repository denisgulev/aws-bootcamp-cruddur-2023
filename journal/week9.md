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
15. click "Edit" and add a stage between "Source" and "Deploy"
16. 