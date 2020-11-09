import { CodeBuild, SecretsManager } from "aws-sdk";

const cb = new CodeBuild();
const sm = new SecretsManager();

const projectName = process.env.CODEBUILD_PROJECT;
const secretId = process.env.SECRET_ID;

export const deploy = async (event) => {
  const { team, workspace, refreshToken, jobInstanceId } = JSON.parse(event.body);
  return await cb.startBuild({
    projectName, environmentVariablesOverride: [
      { name: "REFRESH_TOKEN", value: refreshToken },
      { name: "JOB_INSTANCE_ID", value: jobInstanceId },
      { name: "TEAM", value: team },
      { name: "WORKSPACE", value: workspace }
    ]
  }).promise()
    .then(() => {
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: "Ok",
            input: event
          },
          null,
          2
        )
      };
    });
};

export const auth = async (event) => {
  const { authorizationToken, methodArn } = event;
  const encodedCredentials = authorizationToken.split(/[ ]+/)[1];
  if (!encodedCredentials) {
    throw new Error('Unauthorized');
  }
  const secret = await sm.getSecretValue({ SecretId: secretId }).promise();
  const { username, password } = JSON.parse(secret.SecretString);
  const credentials = Buffer.from(encodedCredentials, 'base64').toString().split(':');
  if (!(credentials[0] === username && credentials[1] === password)) {
    throw new Error('Unauthorized');
  }
  return {
    principalId: username,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: methodArn
        }
      ]
    }
  };
}
