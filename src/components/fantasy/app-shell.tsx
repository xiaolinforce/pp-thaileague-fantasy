"use client";

import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ListChecks,
  LockKeyhole,
  Menu,
  Settings,
  Shirt,
  Trophy,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";
import {
  FloatingLanguageTester,
  Localized,
  useLanguage,
} from "@/components/fantasy/i18n";
import { useNavigationAvailability } from "@/components/fantasy/navigation-availability";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAppIdentity } from "@/components/fantasy/identity";
import { useNavigationBlocker } from "@/components/fantasy/navigation-blocker";
import type { AppIdentity } from "@/lib/auth/types";
import styles from "./app-shell.module.css";

const navigation = [
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
          <strong>THAI LEAGUE</strong>
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
  const { requestNavigation } = useNavigationBlocker();
  const { pointsEnabled } = useNavigationAvailability();
  const { language, translate } = useLanguage();
  const pointsDisabledLabel =
    language === "th"
      ? "คะแนน — เปิดใช้งานหลัง Gameweek 1 ปิดรับจัดทีม"
      : "Points — available after Gameweek 1 closes";
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
        onNavigate={(event) => {
          if (requestNavigation(event, href)) onNavigate?.();
        }}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <Brand />
      <nav className="side-nav" aria-label={translate("เมนูหลัก")}>
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          const disabled = href === "/points" && !pointsEnabled;

          if (disabled) {
            return (
              <button
                key={href}
                type="button"
                className={styles.disabledNavigationItem}
                disabled
                aria-label={pointsDisabledLabel}
                title={pointsDisabledLabel}
              >
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span>{translate(label)}</span>
                <LockKeyhole
                  className={styles.disabledNavigationLock}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
            );
          }

          return (
            <Fragment key={href}>
              {linkFor({
                href,
                className: active ? "active" : undefined,
                ariaCurrent: active ? "page" : undefined,
                children: (
                  <>
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                    <span>{translate(label)}</span>
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
              <span>{translate("ช่วยเหลือ")}</span>
            </>
          ),
        })}
        {linkFor({
          href: "/profile#language",
          children: (
            <>
              <Settings size={20} aria-hidden="true" />
              <span>{translate("ตั้งค่า")}</span>
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
                <strong>
                  {identity?.teamName ?? translate("บัญชีผู้เล่น")}
                </strong>
                <small>
                  {identity?.isGuest
                    ? translate("ผู้เล่น Guest")
                    : translate("ผู้จัดการทีม")}
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
                <SheetClose
                  className="compact-sidebar-close"
                  aria-label="ปิดเมนูหลัก"
                >
                  <Menu size={17} strokeWidth={2} aria-hidden="true" />
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

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  titleClassName?: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <Localized>
      <>
        <h1 className="sr-only">{title}</h1>
        {actions ? (
          <section className="page-intro product-page-intro page-intro--actions-only">
            <div className="intro-actions">{actions}</div>
          </section>
        ) : null}
      </>
    </Localized>
  );
}
