import { gql, GraphQLClient } from "graphql-request";
import fetch from "node-fetch";
import { createWriteStream } from "fs";

const modifyApiUrl = "https://develop.ci.modify.lfrg.dev";
const modifyApiKey = "AIzaSyA1XfnPJ4XNTT94qAU3z6c1taYMhkykoWA";
const outputPath = "./modify-files.tar";

const refreshToken = process.env.REFRESH_TOKEN;
const team = process.env.TEAM;
const workspace = process.env.WORKSPACE;
const workspaceBranch = process.env.WORKSPACE_BRANCH || "master";
const connector = process.env.CONNECTOR || "docs";
const connectorPath = process.env.CONNECTOR_PATH || "/gatsby/";

(async () => {
  // Get access token
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);
  const accessToken = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${modifyApiKey}`,
    { method: "POST", body: params }
  )
    .then(res => res.json())
    .then(json => json.id_token);

  // Get download link
  const graphQLClient = new GraphQLClient(`${modifyApiUrl}/graphql`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const query = gql`
      {
          team(slug: "${team}") {
              workspace(slug: "${workspace}") {
                  branch(slug: "${workspaceBranch}") {
                      connectorBranch(connectorSlug: "${connector}") {
                          downloadTarballUrl(path: "${connectorPath}") {
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
  const response = await fetch([modifyApiUrl, downloadPath].join(""), {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const fileStream = createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
})();
