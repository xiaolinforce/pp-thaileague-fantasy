"use client";

import { createContext, useContext, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { useLanguage } from "@/components/fantasy/i18n";
import styles from "./admin.module.css";

export const AdminPendingContext = createContext(false);

export function AdminPendingIndicator() {
  return (
    <span className="spin" aria-hidden="true">
      <LoaderCircle width={16} height={16} />
    </span>
  );
}

export function AdminActionButton({
  children,
  className,
  disabled,
  pending = false,
  pendingLabel = "กำลังดำเนินการ…",
  type = "submit",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
}) {
  const { pending: formPending } = useFormStatus();
  const filterPending = useContext(AdminPendingContext);
  const { translate: t } = useLanguage();
  const busy = pending || formPending || filterPending;

  return (
    <>
      <button
        {...props}
        type={type}
        className={`${className ?? "primary-button"} ${styles.pendingButton}`}
        disabled={disabled || busy}
        aria-busy={busy}
      >
        {busy ? <AdminPendingIndicator /> : null}
        <span data-localize="off">
          {busy
            ? t(pendingLabel)
            : typeof children === "string"
              ? t(children)
              : children}
        </span>
      </button>
      <span className="sr-only" role="status">
        {busy ? t(pendingLabel) : ""}
      </span>
    </>
  );
}
