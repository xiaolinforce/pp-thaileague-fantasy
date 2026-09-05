import type { ReactNode } from "react";
import { RootDocument } from "@/components/fantasy/root-document";
export { metadata } from "@/components/fantasy/root-document";
import { PublicProviders } from "@/components/fantasy/public-providers";
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ locale: "en" }];
}
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument language="en">
      <PublicProviders language="en">{children}</PublicProviders>
    </RootDocument>
  );
}
