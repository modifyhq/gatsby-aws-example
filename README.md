# Gatsby Demo

Publishing Modify managed content to an AWS S3 static site using Gatsby.

This example assumes the following:
- Modify Team: healthforge
- Modify Workspace: demo
- Github Username: healthforge
- Github Repository: gatsby-demo

## Modify connnector

Create a Modify Connector in your workspace called `docs` with protected access mode.

Branch the new connector to `develop` in order to make changes.

Add a file to the connector root called `/gatsby/hello-world/index.md` with the following content:
```
---
title: Test Post
date: "2020-11-11T11:11:11.111Z"
---
## Subtitle

Some text
``` 
and commit your changes.

Use Update Branch to merge your changes back to `master`.

## AWS Deploy

We will use serverless to deploy:

- S3 bucket to host the static website
- Codebuild project to build the Gatsby website and deploy to S3
- Lambda to trigger build/deploy
- API gateway to allow lambda to be triggered from Modify

It assumes you have a working AWS account with credentials configured

```bash
npm install
npm run deploy
```

The website URL is shown as `BucketURL`

The API gateway deploy endpoint is shown as `endpoints: POST`. This is required in the next section.

Random API credentials are generated and stored in an AWS secret. The ARN of the secret is shown as `SecretARN`.

To get the secret values run:
```bash
aws secretsmanager get-secret-value --secret-id <SecretARN> --region eu-west-1 --query 'SecretString' --output text
``` 

### Modify Job

Create credentials:

- Name: Gatsby Demo
- Username: `<secret username>`
- Password: `<secret password>`

Create a new Job:

- Name: Gatsby Demo
- Target: POST `<API gateway deploy endpoint>`
- Headers:
    - Accept: application/json
- Payload:
    ```
    {
        "refreshToken":"{{REFRESH_TOKEN}}",
        "jobInstanceId":"{{JOB_INSTANCE_ID}}",
        "team": "healthforge",
        "workspace": "demo"
    }
    ```
- Credentials: Gatsby Demo
