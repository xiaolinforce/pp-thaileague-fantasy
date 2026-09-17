import {
  recordDeadlineUnsubscribe,
  unsubscribeUserFromToken,
} from "@/lib/email/deadline-unsubscribe";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = token.length <= 2048 ? unsubscribeUserFromToken(token) : null;
  if (!userId) {
    return new Response("Invalid unsubscribe link", { status: 400 });
  }
  const body = await request.text();
  if (body !== "List-Unsubscribe=One-Click") {
    return new Response("Invalid one-click request", { status: 400 });
  }
  await recordDeadlineUnsubscribe(userId);
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
