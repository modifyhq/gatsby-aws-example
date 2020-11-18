import { gql, GraphQLClient } from "graphql-request";
import { config, getAccessToken } from "./modify-common";

(async () => {
  const accessToken = await getAccessToken();

  // Mark job as done
  const graphQLClient = new GraphQLClient(`${config.modifyApiUrl}/graphql`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const query = gql`
      mutation {
          updateJobInstanceStatus(
              id: "${config.jobInstanceId}"
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
