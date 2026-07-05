import { handleAgentControlRequest } from "@/lib/stream-server";

export async function POST(request: Request) {
  return handleAgentControlRequest(request, {
    actionSuffix: "interrupt",
    genericErrorMessage: "Could not interrupt the AI teacher session.",
    logLabel: "Failed to interrupt Vision Agent session.",
    unauthenticatedMessage:
      "Sign in before interrupting an AI teacher session.",
  });
}
