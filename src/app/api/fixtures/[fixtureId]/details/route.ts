import { getFixtureMatchDetails } from "@/data/match-details";
import { getAuthSession } from "@/lib/auth/context";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fixtureId: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return Response.json(
      { error: "unauthenticated" },
      { status: 401, headers: NO_STORE },
    );
  }

  const { fixtureId } = await params;
  if (!UUID_PATTERN.test(fixtureId)) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE },
    );
  }

  const details = await getFixtureMatchDetails(fixtureId);
  if (!details) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE },
    );
  }
  return Response.json(details, { headers: NO_STORE });
}
