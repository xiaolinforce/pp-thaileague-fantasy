import "server-only";
import { getRequestLanguage } from "@/lib/i18n/server";
import { publicMetadata, type PublicPath } from "@/lib/seo";

export async function pageMetadata(path: PublicPath) {
  return publicMetadata(path, await getRequestLanguage());
}
