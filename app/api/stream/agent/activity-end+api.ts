import { handleAgentControlRequest } from "@/lib/stream-server";

export async function POST(request: Request) {
  return handleAgentControlRequest(request, {
    actionSuffix: "activity-end",
    genericErrorMessage: "Could not update the AI teacher session.",
    logLabel: "Failed to end Vision Agent user activity.",
    unauthenticatedMessage: "Sign in before updating an AI teacher session.",
  });
}
