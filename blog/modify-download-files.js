import { gql, GraphQLClient } from "graphql-request";
import fetch from "node-fetch";
import { createWriteStream } from "fs";
import { config, getAccessToken } from "./modify-common";

(async () => {
  const accessToken = await getAccessToken();

  // Get download link
  const graphQLClient = new GraphQLClient(`${config.modifyApiUrl}/graphql`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const query = gql`
      {
          team(slug: "${config.team}") {
              workspace(slug: "${config.workspace}") {
                  branch(slug: "${config.workspaceBranch}") {
                      connectorBranch(connectorSlug: "${config.connector}") {
                          downloadTarballUrl(path: "${config.connectorPath}") {
                              value
                              error
                          }
                      }
                  }
              }
          }
      }
  `;
  const downloadPath = await graphQLClient.request(query)
    .then(data => data.team.workspace.branch.connectorBranch.downloadTarballUrl.value);

  // Download tarball
  const response = await fetch([config.modifyApiUrl, downloadPath].join(""), {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const fileStream = createWriteStream(config.outputPath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
})();
