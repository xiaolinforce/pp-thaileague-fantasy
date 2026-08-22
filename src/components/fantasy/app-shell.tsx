"use client";

import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Home,
  ListChecks,
  MoreHorizontal,
  Settings,
  Shirt,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Localized } from "@/components/fantasy/i18n";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAppIdentity } from "@/components/fantasy/identity";

const navigation = [
  { label: "ภาพรวม", shortLabel: "หน้าแรก", href: "/dashboard", icon: Home },
  { label: "ทีมของฉัน", shortLabel: "ทีม", href: "/team", icon: Shirt },
  { label: "คะแนน", shortLabel: "คะแนน", href: "/points", icon: ListChecks },
  { label: "ลีก", shortLabel: "ลีก", href: "/leagues", icon: Trophy },
  {
    label: "โปรแกรมและสถิติ",
    shortLabel: "โปรแกรม",
    href: "/fixtures",
    icon: CalendarDays,
  },
  {
    label: "โปรไฟล์และกติกา",
    shortLabel: "โปรไฟล์",
    href: "/profile",
    icon: UserRound,
  },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="PP Thai League Fantasy">
      <span className="brand-mark">
        <span>PP</span>
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>PP THAI</strong>
          <span>FANTASY</span>
        </span>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const identity = useAppIdentity();
  const initials = (identity?.managerName ?? "Guest")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const moreActive = navigation.slice(4).some((item) => item.href === pathname);

  return (
    <Localized>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <aside className="sidebar">
          <Brand />
          <nav className="side-nav" aria-label="เมนูหลัก">
            {navigation.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  href={href}
                  className={active ? "active" : ""}
                  key={href}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                  {active && <span className="nav-pip" />}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <Link href="/profile#rules">
              <CircleHelp size={20} aria-hidden="true" />
              <span>ช่วยเหลือ</span>
            </Link>
            <Link href="/profile#language">
              <Settings size={20} aria-hidden="true" />
              <span>ตั้งค่า</span>
            </Link>
            <Link href="/profile" className="manager-card">
              <span className="manager-avatar">{initials}</span>
              <span>
                <strong>{identity?.teamName ?? "บัญชีผู้เล่น"}</strong>
                <small>
                  {identity?.isGuest ? "ผู้เล่น Guest" : "ผู้จัดการทีม"}
                </small>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <div className="main-shell">{children}</div>

        <nav className="mobile-nav" aria-label="เมนูมือถือ">
          {navigation.slice(0, 4).map(({ href, shortLabel, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                href={href}
                className={active ? "active" : ""}
                key={href}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                <span>{shortLabel}</span>
              </Link>
            );
          })}
          <Sheet>
            <SheetTrigger
              className={moreActive ? "active" : ""}
              aria-current={moreActive ? "page" : undefined}
            >
              <MoreHorizontal size={21} strokeWidth={1.8} aria-hidden="true" />
              <span>เพิ่มเติม</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="mobile-more-sheet">
              <SheetHeader>
                <SheetTitle>เมนูเพิ่มเติม</SheetTitle>
                <SheetDescription>
                  เข้าถึงการแข่งขัน โปรแกรม และการตั้งค่าของคุณ
                </SheetDescription>
              </SheetHeader>
              <div className="mobile-more-links">
                {navigation.slice(4).map(({ label, href, icon: Icon }) => (
                  <SheetClose
                    render={<Link href={href} />}
                    nativeButton={false}
                    key={href}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </SheetClose>
                ))}
                <SheetClose
                  render={<Link href="/profile#language" />}
                  nativeButton={false}
                >
                  <Settings size={20} aria-hidden="true" />
                  <span>ตั้งค่า</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </SheetClose>
                <SheetClose
                  render={<Link href="/profile#rules" />}
                  nativeButton={false}
                >
                  <CircleHelp size={20} aria-hidden="true" />
                  <span>ช่วยเหลือ</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </Localized>
  );
}

export function PageHeader({
  eyebrow,
  title,
  titleClassName,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  titleClassName?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Localized>
      <section className="page-intro product-page-intro">
        <div>
          {eyebrow ? <span className="eyebrow orange">{eyebrow}</span> : null}
          <h1 className={titleClassName ? `page-title ${titleClassName}` : "page-title"}>
            {title}
          </h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions && <div className="intro-actions">{actions}</div>}
      </section>
    </Localized>
  );
}
