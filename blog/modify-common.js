import fetch from "node-fetch";

export const config = {
  modifyApiUrl:  process.env.MODIFY_API_URL || "https://app.modifyhq.com",
  modifyApiKey:  process.env.MODIFY_API_KEY || "AIzaSyAUmlhpu52XymA7IjSfeProj0mD_Zp6HI8",
  outputPath:  process.env.OUTPUT_PATH || "./modify-files.tar",
  refreshToken:  process.env.REFRESH_TOKEN,
  jobInstanceId:  process.env.JOB_INSTANCE_ID,
  team:  process.env.TEAM,
  workspace:  process.env.WORKSPACE,
  workspaceBranch:  process.env.WORKSPACE_BRANCH || "master",
  connector:  process.env.CONNECTOR || "docs",
  connectorPath:  process.env.CONNECTOR_PATH || "/gatsby/"
}

export const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", config.refreshToken);
  return fetch(
    `https://securetoken.googleapis.com/v1/token?key=${config.modifyApiKey}`,
    { method: "POST", body: params }
  )
    .then(res => res.json())
    .then(json => json.id_token);
};
