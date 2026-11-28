import FixturesClient from "./client";
import { getFixturesDataset } from "@/data/fixtures";
import { pageMetadata } from "@/lib/seo-server";

export const generateMetadata = () => pageMetadata("/fixtures");

export default async function FixturesPage() {
  const data = await getFixturesDataset();
  return <FixturesClient data={data} />;
}
