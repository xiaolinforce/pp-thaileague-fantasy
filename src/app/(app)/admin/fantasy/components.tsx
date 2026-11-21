"use client";

import Link, { useLinkStatus } from "next/link";
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CircleCheck, Info, TriangleAlert } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./admin.module.css";
import { adminFieldLabels, statusLabels } from "@/lib/admin-copy";
import {
  AdminActionButton,
  AdminPendingContext,
  AdminPendingIndicator,
} from "./admin-action-button";

/** Inline progress for dynamic admin links that cannot be prefetched. */
export function LinkPendingHint() {
  const { pending } = useLinkStatus();
  return pending ? <AdminPendingIndicator /> : null;
}

export function AdminLocalized({ children }: { children: ReactNode }) {
  return <Localized>{children}</Localized>;
}

export function AdminHeading({
  title,
  description,
  back,
  children,
  titleIsData = false,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
  /** User-entered names such as team names must never be dictionary-translated. */
  titleIsData?: boolean;
}) {
  const { translate: t } = useLanguage();
  return (
    <header className={styles.heading}>
      <div>
        {back ? (
          <Link prefetch={false} className={styles.backLink} href={back.href}>
            <ChevronLeft aria-hidden="true" width={16} height={16} />
            {t(back.label)}
          </Link>
        ) : null}
        {titleIsData ? (
          <h1 data-localize="off">{title}</h1>
        ) : (
          <h1>{t(title)}</h1>
        )}
        {description ? <p>{t(description)}</p> : null}
      </div>
      {children ? (
        <div className={styles.headingActions}>{children}</div>
      ) : null}
    </header>
  );
}

/** Peer views of the same record, such as a team's squad and its points. */
export function AdminTabs({
  label,
  items,
}: {
  label: string;
  items: Array<{ href: string; label: string; current: boolean }>;
}) {
  const { translate: t } = useLanguage();
  return (
    <nav className={styles.tabs} aria-label={t(label)}>
      {items.map((item) => (
        <Link
          key={item.href}
          prefetch={false}
          href={item.href}
          className={styles.tab}
          aria-current={item.current ? "page" : undefined}
        >
          {t(item.label)}
          <LinkPendingHint />
        </Link>
      ))}
    </nav>
  );
}

export type AdminNoticeTone = "info" | "warning" | "danger" | "success";

export function AdminNotice({
  tone = "info",
  title,
  children,
}: {
  tone?: AdminNoticeTone;
  title?: ReactNode;
  children?: ReactNode;
}) {
  const Icon =
    tone === "danger" || tone === "warning"
      ? TriangleAlert
      : tone === "success"
        ? CircleCheck
        : Info;
  return (
    <div
      className={`${styles.notice} ${styles[`notice_${tone}`]}`}
      role={tone === "danger" ? "alert" : undefined}
    >
      <Icon aria-hidden="true" width={18} height={18} />
      <div>
        {title ? <strong>{title}</strong> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}

export function AdminUrlSelect({
  name,
  label,
  value,
  options,
  hideLabel = false,
  reset = [],
}: {
  name: string;
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  hideLabel?: boolean;
  reset?: string[];
}) {
  const emptyValue = "__admin_empty__";
  const router = useRouter();
  const { translate: t } = useLanguage();
  const { requestNavigation } = useNavigationBlocker();
  const labelId = useId();
  const [pending, startTransition] = useTransition();
  const selectedValue = value ?? options[0]?.value ?? "";

  const navigate = (nextValue: string) => {
    if (pending || nextValue === selectedValue) return;
    const params = new URLSearchParams(window.location.search);
    if (nextValue) params.set(name, nextValue);
    else params.delete(name);
    reset.forEach((key) => params.delete(key));
    const query = params.toString();
    const href = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (
      requestNavigation(
        {
          preventDefault() {},
        },
        href,
      )
    ) {
      startTransition(() => router.push(href));
    }
  };

  return (
    <div className={styles.urlSelect} aria-busy={pending}>
      {hideLabel ? null : (
        <span id={labelId} className={styles.urlSelectLabel}>
          {t(label)}
        </span>
      )}
      <Select
        value={selectedValue || emptyValue}
        onValueChange={(nextValue) =>
          nextValue !== null &&
          navigate(String(nextValue) === emptyValue ? "" : String(nextValue))
        }
      >
        <SelectTrigger
          className={styles.urlSelectTrigger}
          aria-label={hideLabel ? t(label) : undefined}
          aria-labelledby={hideLabel ? undefined : labelId}
          disabled={pending || options.length === 0}
          aria-busy={pending}
        >
          <SelectValue />
          {pending ? <AdminPendingIndicator /> : null}
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => (
            <SelectItem
              key={option.value || "all"}
              value={option.value || emptyValue}
            >
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
  autoSubmit = true,
}: {
  children: ReactNode;
  dependencies?: Record<string, string[]>;
  autoSubmit?: boolean;
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
    if (pending) return;
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
        if (autoSubmit && event.target instanceof HTMLSelectElement)
          navigate(event.currentTarget, event, event.target.name);
      }}
    >
      <AdminPendingContext.Provider value={pending}>
        {children}
      </AdminPendingContext.Provider>
    </form>
  );
}

/**
 * Status tone carries the same meaning across admin pages. The written label
 * remains the source of meaning; colour only speeds up scanning.
 */
const statusTones: Record<string, string> = {
  planned: "neutral",
  open: "success",
  locked: "info",
  provisional: "warning",
  final: "info",
  member: "info",
  guest: "neutral",
  bot: "accent",
  abandoned: "neutral",
  scheduled: "neutral",
  live: "warning",
  finished: "success",
  postponed: "danger",
  cancelled: "danger",
  inactive: "neutral",
};
export function Status({ value }: { value: string }) {
  const { translate: t } = useLanguage();
  const tone = statusTones[value] ?? "neutral";
  return (
    <span className={`${styles.badge} ${styles[`tone_${tone}`]}`}>
      {t(statusLabels[value] ?? value)}
    </span>
  );
}
export function Pagination({
  page,
  total,
  base,
  params,
  pageSize = 30,
}: {
  page: number;
  total: number;
  base: string;
  params: Record<string, string>;
  pageSize?: number;
}) {
  const { translate: t, language } = useLanguage();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const url = (n: number) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== ""),
    );
    query.set("page", String(n));
    return `${base}?${query}`;
  };
  const numbers = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  return (
    <nav className={styles.pagination} aria-label={t("แบ่งหน้า")}>
      <span data-localize="off">
        {language === "th"
          ? `ทั้งหมด ${total.toLocaleString()} รายการ`
          : `${total.toLocaleString()} total`}
      </span>
      {pages > 1 ? (
        <div className={styles.pageLinks}>
          {page > 1 ? (
            <Link
              prefetch={false}
              className={styles.pageLink}
              href={url(page - 1)}
            >
              {t("ก่อนหน้า")}
            </Link>
          ) : null}
          {numbers.map((n, index) => (
            <Fragment key={n}>
              {index > 0 && n - numbers[index - 1] > 1 ? (
                <span aria-hidden="true">…</span>
              ) : null}
              <Link
                prefetch={false}
                className={styles.pageLink}
                href={url(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`${t("หน้า")} ${n}`}
              >
                {n}
              </Link>
            </Fragment>
          ))}
          {page < pages ? (
            <Link
              prefetch={false}
              className={styles.pageLink}
              href={url(page + 1)}
            >
              {t("ถัดไป")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

const hiddenPreviewFields = new Set([
  "fixtureId",
  "fantasyPlayerId",
  "effectiveGameweekId",
  "gameweekId",
  "reason",
]);

function previewValue(
  key: string,
  value: string,
  valueLabels: Record<string, Record<string, string>>,
) {
  if (value === "") return "—";
  return valueLabels[key]?.[value] ?? value;
}

export function AdminForm({
  action,
  children,
  label,
  confirmation,
  trackChanges = true,
  initialValues,
  valueLabels = {},
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  label: string;
  confirmation: { th: string; en: string };
  trackChanges?: boolean;
  /** Saved values; the confirmation then lists only changed fields. */
  initialValues?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
}) {
  const { translate: t, language } = useLanguage();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [payload, setPayload] = useState<FormData | null>(null);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const saving = useRef(false);
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
    if (!payload || pending || saving.current) return;
    const data = payload;
    saving.current = true;
    startTransition(async () => {
      setResult(null);
      try {
        await action(data);
        setDirty(false);
        setResult("success");
      } catch {
        setResult("error");
      } finally {
        saving.current = false;
        setPayload(null);
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
            <AdminActionButton
              type="submit"
              className="primary-button"
              pending={pending}
              pendingLabel="กำลังบันทึก…"
            >
              {label}
            </AdminActionButton>
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
        onOpenChange={(open) => !open && !pending && setPayload(null)}
      >
        <DialogContent
          className="product-dialog"
          closeLabel={t("ปิด")}
          showCloseButton={!pending}
        >
          <DialogHeader>
            <DialogTitle>{t(label)}</DialogTitle>
            <DialogDescription>{confirmation[language]}</DialogDescription>
          </DialogHeader>
          {payload && trackChanges
            ? (() => {
                const entries = Array.from(payload.entries())
                  .filter(([key]) => !hiddenPreviewFields.has(key))
                  .map(([key, value]) => [key, String(value)] as const);
                const changed = initialValues
                  ? entries.filter(
                      ([key, value]) => (initialValues[key] ?? "") !== value,
                    )
                  : entries;
                const reason = String(payload.get("reason") ?? "").trim();
                return (
                  <div className={styles.changePreview}>
                    {changed.length ? (
                      <table className={styles.diffTable}>
                        <thead>
                          <tr>
                            <th scope="col">{t("ช่องข้อมูล")}</th>
                            {initialValues ? (
                              <th scope="col">{t("ค่าเดิม")}</th>
                            ) : null}
                            <th scope="col">{t("ค่าใหม่")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changed.map(([key, value]) => (
                            <tr key={key}>
                              <th scope="row">
                                {t(adminFieldLabels[key] ?? key)}
                              </th>
                              {initialValues ? (
                                <td>
                                  {t(
                                    previewValue(
                                      key,
                                      initialValues[key] ?? "",
                                      valueLabels,
                                    ),
                                  )}
                                </td>
                              ) : null}
                              <td>
                                <strong>
                                  {t(previewValue(key, value, valueLabels))}
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className={styles.hint}>
                        {t(
                          "ไม่มีค่าที่เปลี่ยน ระบบจะบันทึกเป็นการตรวจซ้ำพร้อมเหตุผล",
                        )}
                      </p>
                    )}
                    {initialValues && changed.length < entries.length ? (
                      <p className={styles.hint} data-localize="off">
                        {language === "th"
                          ? `ไม่เปลี่ยน ${entries.length - changed.length} ช่อง`
                          : `${entries.length - changed.length} unchanged fields`}
                      </p>
                    ) : null}
                    {reason ? (
                      <p className={styles.previewReason}>
                        <span>{t("เหตุผล")}</span>
                        <span data-localize="off">{reason}</span>
                      </p>
                    ) : null}
                  </div>
                );
              })()
            : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setPayload(null)}
            >
              {t("กลับไปตรวจสอบ")}
            </Button>
            <AdminActionButton
              type="button"
              pending={pending}
              pendingLabel="กำลังบันทึก…"
              onClick={save}
            >
              ยืนยันการบันทึก
            </AdminActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
