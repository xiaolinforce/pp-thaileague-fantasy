import type { Metadata } from "next";
import { Mitr } from "next/font/google";
import { LanguageProvider } from "@/components/fantasy/i18n";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "Thai Fantasy — เกมแฟนตาซีฟุตบอลไทย",
  description: "จัดทีมในฝัน เลือกนักเตะไทยลีก และแข่งขันกับเพื่อนตลอดฤดูกาล",
  openGraph: {
    title: "Thai Fantasy — เกมแฟนตาซีฟุตบอลไทย",
    description: "จัดทีมไทยลีกในฝันของคุณ วางแผน และท้าทายเพื่อนตลอดฤดูกาล",
    type: "website",
    locale: "th_TH",
    images: [{ url: "/og.png", width: 1729, height: 910 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thai Fantasy",
    description: "จัดทีมไทยลีกในฝันของคุณ",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={mitr.variable} suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-center" richColors />
        </LanguageProvider>
      </body>
    </html>
  );
}
