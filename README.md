# Gatsby AWS Example

This example repository is intended to show how to define and run a job that publishes Modify managed 
content to an AWS S3 static site, using Gatsby and AWS Serverless for the build.

## `blog`

This folder contains a basic Gatsby starter blog, with some additional scripts to fetch
content from Modify

- `npm run modify:download`: Downloads content from a Modify connector as a tarball to `.modify-files.tar`

- `npm run modify:unpack`: Unpacks the tarball to `content/blog`

- `npm run modify:clean`: Deletes the `content/blog` folder and tarball

- `npm run modify:notify`: Notifies Modify that the Job Instance has completed successfully

- `npm run deploy`: Writes a Gatsby static site to an S3 bucket defined by the `BUCKET` environment
  variable

## `infra`

This folder contains a serverless stack which includes:

- S3 bucket to host the static website
- Codebuild project to build the blog and deploy it to S3
- `deploy` Lambda to start the CodeBuild project
- API gateway to allow the Lambda to be triggered from Modify Jobs
- `auth` Lambda to authorize Modify using Basic Auth credentials
- Randomly generated Secret which is used by `auth` to authenticate Modify

See `infra/serverless.yml` for a full list of resources which are created.

## `buildspec.yml`

This file is read by CodeBuild when the project is started and defines the commands which are run
to build and deploy the static site.

## Step 0 (Optional) - Fork the repository

If you wish to make any modifications to this example then you should fork the repository to your own
Github account e.g. `my-org/gatsby-aws-example`, otherwise you can run it directly.

The repository URL is part of the stack configuration, so forking will require that you override an
environment variable before running [Step 2](#step-2---setup-your-infrastructure):

```bash
export GITHUB_REPOSITORY=my-org/gatsby-aws-example
```

## Step 1 - Setup Modify

The following steps assume you have a Modify team with the slug `my-team`. 

Create a new workspace with the slug `gatsby-aws-example` and base branch ID `master`.

Create a new Modify connector in your workspace called `docs` with `Editable` access mode.

Add a file to the connector called `/gatsby/hello-world/index.md` with the following content:
```
---
title: Test Post
date: "2020-11-11T11:11:11.111Z"
---
## Subtitle

Some text
``` 
and commit your changes.

If you have an existing connector that you would like to use, then you will need to adjust the Job
Definition in [Step 3](#step-3---create-modify-job) to suit.

## Step 2 - Setup your infrastructure

The following steps assume you have installed and configured the AWS CLI (https://aws.amazon.com/cli/).

Deploy the serverless stack to your configured AWS account:
```bash
cd infra
npm install
npm run deploy
```

Note: Only one copy of this stack can be deployed to a single AWS account.

When complete, make a note of the following:
- The website URL is shown in the output as `BucketURL`
- The API gateway `deploy` endpoint is shown after `endpoints: POST`
- A random password has been generated and stored in an AWS Secret, the ARN of the secret is shown
  as `SecretARN`. To get the secret values run:
  ```bash
  aws secretsmanager get-secret-value --secret-id <SecretARN> --region eu-west-1 --query 'SecretString' --output text
  ``` 

## Step 3 - Create Modify Job

In Modify, select the correct team and workspace and go to the Jobs section.

Click the `Create Job` button and and then select the `Example: Publish Gatsby to AWS S3` template:

You will need to complete the following fields:

- Target: `<API gateway deploy endpoint>`

Next click `+` next to Credentials and enter the following:
- Name: `Gatsby AWS Example`
- Username: `modify`
- Password: `<secret password>`

Then click `Add Credential` to create the new credential and return to the `Create Job` form.

Your new credential should have been selected automatically, so you can finally click `Create` to
save your new Job Definition.

Click the name of the new Job Definition to display the details.

## Step 4 - Run the Modify Job

Click `Start` to run the Job and a new Job Instance will be created. This will `POST` the payload to
the deploy stack API gateway along with configured credentials, `REFRESH_TOKEN` and
`JOB_INSTANCE_ID`. Modify expects the remote system (our serverless stack) to notify when the job is
complete using these details.

The serverless stack flow is as follows:
- API gateway authenticates the POST request using the supplied credentials
- The `deploy` Lambda starts the Codebuild project, passing the payload as environment variables
- Codebuild reads its configuration from `buildspec.yml` in the root of the repository. This will
  download the blog content from Modify, build the static site, upload to S3 and finally notify
  Modify that the Job is complete
  
When this is complete you should see the Job Instance in Modify change from `Started` to `Finished`,
and the static site will be visible on the website URL noted above.
