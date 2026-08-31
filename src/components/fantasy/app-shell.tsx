"use client";

import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ListChecks,
  LockKeyhole,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Shirt,
  Trophy,
  UserPlus,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth/client";
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

const accountNavigation = [
  {
    label: "โปรไฟล์",
    href: "/profile",
    icon: UserRound,
    requiresIdentity: true,
  },
  {
    label: "ตั้งค่า",
    href: "/settings",
    icon: Settings,
    requiresIdentity: true,
  },
  {
    label: "กติกาเกม",
    href: "/rules",
    icon: BookOpenText,
    requiresIdentity: false,
  },
  {
    label: "ช่วยเหลือ",
    href: "/help",
    icon: CircleHelp,
    requiresIdentity: false,
  },
  {
    label: "แอดมิน",
    href: "/admin/fantasy",
    icon: ShieldCheck,
    requiresIdentity: true,
    requiresAdmin: true,
  },
] as const;

function ManagerMenu({
  identity,
  initials,
  pathname,
  onNavigate,
}: {
  identity: AppIdentity;
  initials: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { requestNavigation } = useNavigationBlocker();
  const { language, translate } = useLanguage();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRouteActive = accountNavigation.some(
    ({ href }) => pathname === href,
  );

  const closeAndNavigate = (
    event: Parameters<typeof requestNavigation>[0],
    href: string,
  ) => {
    if (!requestNavigation(event, href)) return;
    setOpen(false);
    onNavigate?.();
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        toast.error(
          language === "th"
            ? "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง"
            : "Could not sign out. Please try again.",
        );
        return;
      }
      setOpen(false);
      onNavigate?.();
      router.replace("/");
      router.refresh();
    } catch {
      toast.error(
        language === "th"
          ? "ออกจากระบบไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
          : "Could not sign out. Check your connection and try again.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  const trigger = (
    <button
      type="button"
      className={`manager-card manager-menu-trigger${accountRouteActive ? " active" : ""}`}
      aria-label={translate("เปิดเมนูผู้จัดการทีม")}
      aria-expanded={open}
    >
      <span className="manager-avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="manager-card-copy">
        {identity ? (
          <strong data-localize="off">{identity.teamName}</strong>
        ) : (
          <strong>{translate("เริ่มเล่น Fantasy")}</strong>
        )}
        <small>
          {identity
            ? identity.isGuest
              ? translate("ผู้เล่น Guest")
              : translate("ผู้จัดการทีม")
            : translate("ยังไม่มีทีม")}
        </small>
      </span>
      <ChevronDown
        className={open ? "manager-menu-chevron open" : "manager-menu-chevron"}
        size={17}
        aria-hidden="true"
      />
    </button>
  );

  const menu = (
    <div className="manager-menu-panel">
      <div className="manager-menu-identity">
        {identity ? (
          <strong data-localize="off">{identity.teamName}</strong>
        ) : (
          <strong>{translate("เริ่มเล่น Fantasy")}</strong>
        )}
        <span>
          {identity
            ? identity.isGuest
              ? translate("ผู้เล่น Guest")
              : (identity.email ?? translate("บัญชีสมาชิก"))
            : translate("เริ่มจัดทีมไทยลีกของคุณ")}
        </span>
      </div>
      <nav aria-label={translate("เมนูผู้จัดการทีม")}>
        {accountNavigation
          .filter(
            (item) =>
              (!item.requiresIdentity || Boolean(identity)) &&
              (!("requiresAdmin" in item) ||
                !item.requiresAdmin ||
                identity?.role === "admin"),
          )
          .map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                href={href}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
                onNavigate={(event) => closeAndNavigate(event, href)}
                key={href}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{translate(label)}</span>
              </Link>
            );
          })}
      </nav>
      <div className="manager-menu-actions">
        {!identity ? (
          <Link href="/" onNavigate={(event) => closeAndNavigate(event, "/")}>
            <LogIn size={18} aria-hidden="true" />
            <span>{translate("เริ่มเล่น")}</span>
          </Link>
        ) : identity.isGuest ? (
          <Link
            href="/upgrade"
            onNavigate={(event) => closeAndNavigate(event, "/upgrade")}
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>{translate("สมัครสมาชิก")}</span>
          </Link>
        ) : null}
        {identity ? (
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            aria-busy={signingOut}
          >
            <LogOut size={18} aria-hidden="true" />
            <span>
              {translate(signingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ")}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className="manager-menu-popover"
        side="top"
        align="start"
        sideOffset={10}
      >
        {menu}
      </PopoverContent>
    </Popover>
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
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
        <ManagerMenu
          identity={identity}
          initials={initials}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const identity = useAppIdentity();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (identity?.teamName ?? "Guest")
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
