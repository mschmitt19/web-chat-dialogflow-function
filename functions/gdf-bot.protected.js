const Dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");

/* Twilio function that sends a payload to dialogflow using service account credentials
 ** Should be a Protected function
 */
async function sendToGDF(gcpCreds, event) {
  // Grab GCP Service Account credentials from protected asset
  const privateKey = gcpCreds["private_key"];
  const clientEmail = gcpCreds["client_email"];
  const projectId = gcpCreds["project_id"];

  // A unique identifier for the given session - random UUID
  const sessionId = uuid.v1();

  const config = {
    credentials: {
      private_key: privateKey,
      client_email: clientEmail,
    },
  };

  try {
    // Creating a new session
    const sessionClient = new Dialogflow.SessionsClient(config);
    const sessionPath = sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );
    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: event.customerMessage,
          // The language used by the client (en-US)
          languageCode: "en-US",
        },
      },
    };
    // Send request and return result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    return result;
  } catch (e) {
    console.log(e);
    return e;
  }
}

exports.handler = async function (context, event, callback) {
  // Setup GCP credentials
  const openGCPCredentials = Runtime.getAssets()["/gcp_sa.json"].open;
  const gcpCreds = JSON.parse(openGCPCredentials());

  const dialogflowResponse = await sendToGDF(gcpCreds, event);
  return callback(null, dialogflowResponse);
};
