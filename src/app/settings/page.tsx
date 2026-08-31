"use client";

import { Cloud, Languages, LoaderCircle, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateInterfaceLanguageAction } from "@/app/fantasy-actions";
import { AppShell } from "@/components/fantasy/app-shell";
import { useAppIdentity } from "@/components/fantasy/identity";
import {
  LanguageSwitcher,
  useLanguage,
  type Language,
} from "@/components/fantasy/i18n";
import { toast } from "@/components/ui/sonner";

export default function SettingsPage() {
  const router = useRouter();
  const identity = useAppIdentity();
  const { language, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const changeLanguage = async (nextLanguage: Language) => {
    const previousLanguage = language;
    setLanguage(nextLanguage);
    setStatus("");
    if (identity?.isGuest) {
      setStatus("บันทึกภาษาบนอุปกรณ์เครื่องนี้แล้ว");
      return;
    }

    setSaving(true);
    try {
      const result = await updateInterfaceLanguageAction({
        language: nextLanguage,
      });
      if (!result.ok) {
        setLanguage(previousLanguage);
        toast.error(result.message);
        return;
      }
      setStatus(result.message);
      router.refresh();
    } catch {
      setLanguage(previousLanguage);
      toast.error(
        previousLanguage === "th"
          ? "บันทึกภาษาไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
          : "Could not save the language. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <main id="main-content" className="content product-content account-page">
        <header className="account-page-header">
          <div>
            <h1>ตั้งค่า</h1>
            <p>เลือกภาษาที่ใช้แสดงผลให้เหมาะกับการใช้งานของคุณ</p>
          </div>
        </header>

        <section
          className="product-card settings-page-card"
          aria-labelledby="language-heading"
        >
          <div className="profile-section-heading">
            <span className="settings-icon orange" aria-hidden="true">
              <Languages />
            </span>
            <div>
              <h2 id="language-heading">ภาษา</h2>
              <p>เปลี่ยนภาษาไทยและอังกฤษได้ทันที</p>
            </div>
          </div>

          <div className="language-preference-panel">
            <div className="language-preference-copy">
              {identity?.isGuest ? (
                <Smartphone aria-hidden="true" />
              ) : (
                <Cloud aria-hidden="true" />
              )}
              <div>
                <strong>ภาษาที่ใช้แสดงผล</strong>
                <span id="language-persistence-help">
                  {identity?.isGuest
                    ? "Guest จะบันทึกการตั้งค่านี้ไว้ในอุปกรณ์เครื่องนี้"
                    : "สมาชิกจะซิงก์การตั้งค่านี้กับบัญชีและอุปกรณ์อื่น"}
                </span>
              </div>
            </div>
            <LanguageSwitcher
              disabled={saving}
              describedBy="language-persistence-help"
              onValueChange={changeLanguage}
            />
          </div>

          <div className="settings-save-status" aria-live="polite">
            {saving ? (
              <>
                <LoaderCircle className="spin" size={16} aria-hidden="true" />
                <span>กำลังบันทึกภาษา…</span>
              </>
            ) : status ? (
              <span>{status}</span>
            ) : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
