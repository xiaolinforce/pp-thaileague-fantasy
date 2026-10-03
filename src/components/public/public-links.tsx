"use client";

import Link from "next/link";
import { useLanguage } from "@/components/fantasy/i18n";
import styles from "./public.module.css";

export function PublicLinks() {
  const { language } = useLanguage();
  const links = [
    ["/", "เริ่มเล่น", "Start playing"],
    ["/rules", "กติกาและวิธีเล่น", "Rules and how to play"],
    ["/thai-league/2026-27/fixtures", "โปรแกรมไทยลีก", "Thai League fixtures"],
    ["/help", "ช่วยเหลือ", "Help"],
    ["/privacy", "ความเป็นส่วนตัว", "Privacy"],
    ["/terms", "ข้อกำหนด", "Terms"],
  ];
  return (
    <nav
      className={styles.links}
      aria-label={language === "th" ? "ข้อมูลเกม" : "Game information"}
    >
      {links.map(([href, th, en]) => (
        <Link key={href} href={href}>
          {language === "th" ? th : en}
        </Link>
      ))}
    </nav>
  );
}
