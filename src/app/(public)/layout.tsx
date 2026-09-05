import type { ReactNode } from "react";
import { RootDocument } from "@/components/fantasy/root-document";
export { metadata } from "@/components/fantasy/root-document";
import { PublicProviders } from "@/components/fantasy/public-providers";
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument language="th">
      <PublicProviders language="th">{children}</PublicProviders>
    </RootDocument>
  );
}
