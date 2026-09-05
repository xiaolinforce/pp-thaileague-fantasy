import type { Metadata } from "next";
import { Mitr } from "next/font/google";
import "@/app/globals.css";

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
  // Prevent iOS data detectors from rewriting server-rendered text into links.
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
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

export function RootDocument({
  children,
  language,
}: {
  children: React.ReactNode;
  language: "th" | "en";
}) {
  return (
    <html lang={language} className={mitr.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
