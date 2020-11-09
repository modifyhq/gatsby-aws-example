import { gql, GraphQLClient } from "graphql-request";
import fetch from "node-fetch";

const modifyApiUrl = "https://develop.ci.modify.lfrg.dev";
const modifyApiKey = "AIzaSyA1XfnPJ4XNTT94qAU3z6c1taYMhkykoWA";

const refreshToken = process.env.REFRESH_TOKEN;
const jobInstanceId = process.env.JOB_INSTANCE_ID;

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

  // Mark job as done
  const graphQLClient = new GraphQLClient(`${modifyApiUrl}/graphql`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const query = gql`
      mutation {
          updateJobInstanceStatus(
              id: "${jobInstanceId}"
              completed: true
              userStatus: "done"
          ) {
              value {
                  id
              }
          }
      }
  `;
  await graphQLClient.request(query);
})();
