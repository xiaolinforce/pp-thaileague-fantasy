export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(
    { ok: true, service: "pp-thaileague-fantasy" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
