"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
import { useNavigationBlocker } from "@/components/fantasy/navigation-blocker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import styles from "./admin.module.css";
import { adminFieldLabels } from "@/lib/admin-copy";

export function AdminLocalized({ children }: { children: ReactNode }) {
  return <Localized>{children}</Localized>;
}

export function AdminHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { translate: t } = useLanguage();
  return (
    <header className={styles.heading}>
      <div>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
    </header>
  );
}
export function AdminDateLabel({
  value,
  th,
  en,
}: {
  value: string | null;
  th: string;
  en: string;
}) {
  const { language, translate: t } = useLanguage();
  return value ? (
    <time dateTime={value}>{language === "th" ? th : en}</time>
  ) : (
    <span>{t("ยังไม่มีข้อมูล")}</span>
  );
}
export function AdminName({ th, en }: { th: string; en: string }) {
  const { language } = useLanguage();
  return <span data-localize="off">{language === "th" ? th : en}</span>;
}
export function NameOption({
  value,
  th,
  en,
}: {
  value: string;
  th: string;
  en: string;
}) {
  const { language } = useLanguage();
  return (
    <option value={value} data-localize="off">
      {language === "th" ? th : en}
    </option>
  );
}
export function AdminFilters({
  children,
  dependencies = {},
}: {
  children: ReactNode;
  dependencies?: Record<string, string[]>;
}) {
  const router = useRouter();
  const { requestNavigation } = useNavigationBlocker();
  const [pending, startTransition] = useTransition();
  const navigate = (
    form: HTMLFormElement,
    event: { preventDefault: () => void },
    changed?: string,
  ) => {
    event.preventDefault();
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string" && value) params.set(key, value);
    });
    for (const key of dependencies[changed ?? "submit"] ?? [])
      params.delete(key);
    const href = `${window.location.pathname}?${params}`;
    if (requestNavigation(event, href))
      startTransition(() => router.push(href));
    else if (changed) {
      const control = form.elements.namedItem(changed);
      if (control instanceof HTMLSelectElement) {
        const previous = Array.from(control.options).findIndex(
          (option) => option.defaultSelected,
        );
        control.selectedIndex = Math.max(0, previous);
      }
    }
  };
  return (
    <form
      className={styles.toolbar}
      aria-busy={pending}
      onSubmit={(event) => navigate(event.currentTarget, event)}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement)
          navigate(event.currentTarget, event, event.target.name);
      }}
    >
      {children}
    </form>
  );
}
export const statusLabels: Record<string, string> = {
  planned: "ยังไม่เปิด",
  open: "เปิดรับจัดทีม",
  provisional: "รอตรวจคะแนน",
  final: "คะแนน Final",
  locked: "ล็อกแล้ว",
  member: "สมาชิก",
  guest: "Guest",
  bot: "Bot",
  abandoned: "Guest เก็บประวัติ",
  scheduled: "รอแข่งขัน",
  live: "กำลังแข่งขัน",
  finished: "จบการแข่งขัน",
  postponed: "เลื่อนการแข่งขัน",
  cancelled: "ยกเลิกการแข่งขัน",
};
export function Status({ value }: { value: string }) {
  const { translate: t } = useLanguage();
  return (
    <span className={styles.badge}>{t(statusLabels[value] ?? value)}</span>
  );
}
export function Pagination({
  page,
  total,
  base,
  params,
}: {
  page: number;
  total: number;
  base: string;
  params: Record<string, string>;
}) {
  const { translate: t } = useLanguage();
  const pages = Math.max(1, Math.ceil(total / 30));
  const url = (n: number) =>
    `${base}?${new URLSearchParams({ ...params, page: String(n) })}`;
  return (
    <nav className={styles.pagination} aria-label={t("แบ่งหน้า")}>
      <span>
        {t("ทั้งหมด")} {total.toLocaleString()} · {t("หน้า")} {page} / {pages}
      </span>
      <div className={styles.actions}>
        {page > 1 && (
          <Link prefetch={false} className={styles.link} href={url(page - 1)}>
            {t("ก่อนหน้า")}
          </Link>
        )}
        {page < pages && (
          <Link prefetch={false} className={styles.link} href={url(page + 1)}>
            {t("ถัดไป")}
          </Link>
        )}
      </div>
    </nav>
  );
}

export function AdminForm({
  action,
  children,
  label,
  confirmation,
  trackChanges = true,
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  label: string;
  confirmation: { th: string; en: string };
  trackChanges?: boolean;
}) {
  const { translate: t, language } = useLanguage();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [payload, setPayload] = useState<FormData | null>(null);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const { setNavigationBlocked } = useNavigationBlocker();
  useEffect(() => {
    if (!trackChanges) return;
    setNavigationBlocked(dirty || pending);
    return () => setNavigationBlocked(false);
  }, [dirty, pending, trackChanges, setNavigationBlocked]);
  useEffect(() => {
    if (!dirty && !pending) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, pending]);
  const save = () => {
    if (!payload || pending) return;
    const data = payload;
    setPayload(null);
    startTransition(async () => {
      setResult(null);
      try {
        await action(data);
        setDirty(false);
        setResult("success");
      } catch {
        setResult("error");
      }
    });
  };
  return (
    <>
      <form
        className={styles.form}
        onChange={() => {
          if (trackChanges) setDirty(true);
          setResult(null);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (pending) return;
          setPayload(new FormData(event.currentTarget));
        }}
        aria-describedby={result ? id : undefined}
      >
        <fieldset disabled={pending} className={styles.form}>
          {children}
          <div className={styles.actions}>
            <button
              type="submit"
              className="primary-button"
              disabled={pending}
              aria-busy={pending}
            >
              {t(pending ? "กำลังบันทึก…" : label)}
            </button>
          </div>
        </fieldset>
        {result && (
          <p
            id={id}
            role={result === "error" ? "alert" : "status"}
            className={`${styles.feedback} ${result === "error" ? styles.error : styles.success}`}
          >
            {t(
              result === "error"
                ? "บันทึกไม่สำเร็จ ตรวจสอบข้อมูลและสถานะล่าสุดก่อนลองอีกครั้ง"
                : "บันทึกสำเร็จ",
            )}
          </p>
        )}
      </form>
      <Dialog
        open={Boolean(payload)}
        onOpenChange={(open) => !open && setPayload(null)}
      >
        <DialogContent className="product-dialog" closeLabel={t("ปิด")}>
          <DialogHeader>
            <DialogTitle>{t(label)}</DialogTitle>
            <DialogDescription>{confirmation[language]}</DialogDescription>
          </DialogHeader>
          {payload && trackChanges && (
            <div className={styles.changePreview}>
              {Array.from(payload.entries())
                .filter(
                  ([key]) =>
                    ![
                      "fixtureId",
                      "fantasyPlayerId",
                      "effectiveGameweekId",
                    ].includes(key),
                )
                .map(([key, value]) => (
                  <p key={key}>
                    <span>{t(adminFieldLabels[key] ?? key)}</span>:{" "}
                    <strong>{String(value) || "—"}</strong>
                  </p>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayload(null)}>
              {t("กลับไปตรวจสอบ")}
            </Button>
            <Button onClick={save}>{t("ยืนยันการบันทึก")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
