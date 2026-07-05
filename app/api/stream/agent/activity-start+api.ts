import { handleAgentControlRequest } from "../_server";

export async function POST(request: Request) {
  return handleAgentControlRequest(request, {
    actionSuffix: "activity-start",
    genericErrorMessage: "Could not update the AI teacher session.",
    logLabel: "Failed to start Vision Agent user activity.",
    unauthenticatedMessage: "Sign in before updating an AI teacher session.",
  });
}
