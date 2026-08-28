import type { Metadata } from "next";
import { Mitr } from "next/font/google";
import { LanguageProvider } from "@/components/fantasy/i18n";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IdentityProvider } from "@/components/fantasy/identity";
import { NavigationBlockerProvider } from "@/components/fantasy/navigation-blocker";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { createAppIdentity } from "@/lib/auth/types";
import "./globals.css";

const mitr = Mitr({
  variable: "--font-mitr",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3006",
  ),
  title: "PP Thai League Fantasy — เกมแฟนตาซีฟุตบอลไทย",
  description: "จัดทีมในฝัน เลือกนักเตะไทยลีก และแข่งขันกับเพื่อนตลอดฤดูกาล",
  openGraph: {
    title: "PP Thai League Fantasy — เกมแฟนตาซีฟุตบอลไทย",
    description: "จัดทีมไทยลีกในฝันของคุณ วางแผน และท้าทายเพื่อนตลอดฤดูกาล",
    type: "website",
    locale: "th_TH",
    images: [{ url: "/og.png", width: 1729, height: 910 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PP Thai League Fantasy",
    description: "จัดทีมไทยลีกในฝันของคุณ",
    images: ["/og.png"],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentFantasyIdentity();
  const identity =
    current?.manager && current.team
      ? createAppIdentity({
          manager: current.manager,
          team: current.team,
          email: current.user.email,
          isGuest: current.isAnonymous,
          role: current.role,
        })
      : null;
  const identityKey = JSON.stringify(identity);
  return (
    <html lang="th" className={mitr.variable} suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <NavigationBlockerProvider>
            <IdentityProvider key={identityKey} identity={identity}>
              <TooltipProvider>{children}</TooltipProvider>
            </IdentityProvider>
          </NavigationBlockerProvider>
          <Toaster position="bottom-center" />
        </LanguageProvider>
      </body>
    </html>
  );
}
