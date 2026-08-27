"use client";

import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Home,
  ListChecks,
  Menu,
  Settings,
  Shirt,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";
import { FloatingLanguageTester, Localized } from "@/components/fantasy/i18n";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAppIdentity } from "@/components/fantasy/identity";
import type { AppIdentity } from "@/lib/auth/types";

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
        <Image
          className="brand-logo"
          src="/logo.png"
          alt="PP Thai League Fantasy"
          width={44}
          height={44}
          priority
        />
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

function SidebarContent({
  pathname,
  identity,
  initials,
  onNavigate,
}: {
  pathname: string;
  identity: AppIdentity;
  initials: string;
  onNavigate?: () => void;
}) {
  const linkFor = ({
    href,
    className,
    ariaCurrent,
    children,
  }: {
    href: string;
    className?: string;
    ariaCurrent?: "page";
    children: ReactNode;
  }) => {
    return (
      <Link
        href={href}
        className={className}
        aria-current={ariaCurrent}
        onClick={onNavigate}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <Brand />
      <nav className="side-nav" aria-label="เมนูหลัก">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Fragment key={href}>
              {linkFor({
                href,
                className: active ? "active" : undefined,
                ariaCurrent: active ? "page" : undefined,
                children: (
                  <>
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                    {active && <span className="nav-pip" />}
                  </>
                ),
              })}
            </Fragment>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        {linkFor({
          href: "/profile#rules",
          children: (
            <>
              <CircleHelp size={20} aria-hidden="true" />
              <span>ช่วยเหลือ</span>
            </>
          ),
        })}
        {linkFor({
          href: "/profile#language",
          children: (
            <>
              <Settings size={20} aria-hidden="true" />
              <span>ตั้งค่า</span>
            </>
          ),
        })}
        {linkFor({
          href: "/profile",
          className: "manager-card",
          children: (
            <>
              <span className="manager-avatar">{initials}</span>
              <span>
                <strong>{identity?.teamName ?? "บัญชีผู้เล่น"}</strong>
                <small>
                  {identity?.isGuest ? "ผู้เล่น Guest" : "ผู้จัดการทีม"}
                </small>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </>
          ),
        })}
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const identity = useAppIdentity();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (identity?.managerName ?? "Guest")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Localized>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <FloatingLanguageTester />
        <aside className="sidebar">
          <SidebarContent
            pathname={pathname}
            identity={identity}
            initials={initials}
          />
        </aside>

        <div className="main-shell">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <div className="compact-topbar">
              <SheetTrigger
                className="compact-menu-trigger"
                aria-label="เปิดเมนูหลัก"
              >
                <Menu size={23} strokeWidth={2} aria-hidden="true" />
              </SheetTrigger>
              <Brand />
            </div>
            <SheetContent
              side="left"
              className="compact-sidebar-sheet"
              showCloseButton={false}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>เมนูหลัก</SheetTitle>
              </SheetHeader>
              <aside className="drawer-sidebar">
                <SheetClose className="compact-sidebar-close" aria-label="ปิดเมนูหลัก">
                  <X size={20} aria-hidden="true" />
                  <span className="sr-only">ปิดเมนูหลัก</span>
                </SheetClose>
                <SidebarContent
                  pathname={pathname}
                  identity={identity}
                  initials={initials}
                  onNavigate={() => setMenuOpen(false)}
                />
              </aside>
            </SheetContent>
          </Sheet>
          {children}
        </div>
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
          <h1
            className={
              titleClassName ? `page-title ${titleClassName}` : "page-title"
            }
          >
            {title}
          </h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions && <div className="intro-actions">{actions}</div>}
      </section>
    </Localized>
  );
}
