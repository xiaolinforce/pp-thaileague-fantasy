import PublicFixtures from "@/components/public/public-fixtures";
import { getFixturesDataset } from "@/data/fixtures";
import { pageMetadata } from "@/lib/seo-server";

export const generateMetadata = () =>
  pageMetadata("/thai-league/2026-27/fixtures");

export default async function Page() {
  const data = await getFixturesDataset();
  return <PublicFixtures data={data} />;
}
