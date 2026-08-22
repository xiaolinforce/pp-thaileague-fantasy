"use client";

import {
  CircleHelp,
  Languages,
  LoaderCircle,
  LogOut,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

import { updateFantasyNamesAction } from "@/app/fantasy-actions";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { useAppIdentity } from "@/components/fantasy/identity";
import { LanguageSwitcher, useLanguage } from "@/components/fantasy/i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { authClient } from "@/lib/auth/client";

const rules = [
  {
    title: "การจัดทีม",
    points: [
      "ขนาดทีม 15 คน: ผู้รักษาประตู 2 กองหลัง 5 กองกลาง 5 และกองหน้า 3 คน",
      "ตัวจริง 11 คนต้องมี 1 GK, อย่างน้อย 3 DEF, 2 MID และ 1 FWD",
      "เลือกนักเตะจากสโมสรเดียวกันได้สูงสุด 3 คน",
      "มีนักเตะต่างชาติได้สูงสุด 7 คน โดยผู้เล่นที่ระบบจัดประเภทเป็นไทยนับในโควตานักเตะไทย",
    ],
  },
  {
    title: "ระดับนักเตะ",
    points: [
      "ระดับ 1 มี 3 ช่อง ระดับ 2 มี 7 ช่อง และระดับ 3 มี 5 ช่อง",
      "ผู้เล่นระดับต่ำกว่าสามารถใช้ช่องระดับสูงกว่าที่ยังว่างได้",
      "มีผู้เล่นระดับ 1 ได้สูงสุด 3 คน และระดับ 1–2 รวมกันสูงสุด 10 คน",
      "ระดับนักเตะมีผลแยกตาม Gameweek",
    ],
  },
  {
    title: "การซื้อขาย",
    points: [
      "ได้รับ Free Transfer เพิ่ม 2 ครั้งหลังแต่ละ Deadline และสะสมได้สูงสุด 4 ครั้ง",
      "Transfer ที่เกินโควต้าฟรีหัก 4 คะแนนต่อครั้ง โดยนับจากความแตกต่างสุทธิของทีม",
      "ยกเลิกการเปลี่ยนแปลงได้ถึง Deadline ซึ่งปิดก่อนคู่แรก 90 นาที",
    ],
  },
  {
    title: "Chips",
    points: [
      "Triple Captain, Bench Boost และ Wildcard ใช้ได้อย่างละ 2 ครั้งต่อฤดูกาล",
      "ใช้ได้ 1 Chip ต่อ Gameweek และใช้ชนิดเดิมใน Gameweek ติดกันได้",
      "ยกเลิก Chip ได้ก่อน Deadline โดย Wildcard ทำให้ Transfer ไม่มีค่าใช้จ่ายและคง Free Transfer ที่สะสมไว้",
    ],
  },
  {
    title: "การคิดคะแนน",
    points: [
      "คิดคะแนนจากนาทีลงสนาม ประตู แอสซิสต์ คลีนชีต การเซฟ จุดโทษ ใบเหลือง ใบแดง และประตูตัวเอง",
      "ไม่มี Defensive Contributions และ Bonus/BPS",
      "ผู้เล่นที่ถูกไล่ออกไม่ถูกคิดประตูที่ทีมเสียหลังออกจากสนาม",
    ],
  },
  {
    title: "แมตช์ตกค้างและอันดับ",
    points: [
      "แมตช์ตกค้างให้คะแนนย้อนหลังใน Gameweek เดิม",
      "ระบบคำนวณ Auto-sub กัปตัน Chips และอันดับใหม่หลังอัปเดตคะแนน",
      "Classic League จัดอันดับจากคะแนนรวม แล้วใช้จำนวน Transfer ที่น้อยกว่าเป็นตัวตัดสิน โดยไม่นับ Wildcard",
    ],
  },
];

const profileSections = [
  { id: "account", label: "ข้อมูลบัญชี", icon: UserRound },
  { id: "team", label: "ข้อมูลทีม", icon: Palette },
  { id: "language", label: "ภาษา", icon: Languages },
  { id: "rules", label: "กติกาเกม", icon: CircleHelp },
] as const;

type ProfileSectionId = (typeof profileSections)[number]["id"];

function initialsFor(value: string | undefined, fallback: string) {
  const initials = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || fallback;
}

function useProfileSectionTracking(): [
  ProfileSectionId,
  (value: SetStateAction<ProfileSectionId>) => void,
] {
  const [activeSection, setActiveSection] =
    useState<ProfileSectionId>("account");

  useEffect(() => {
    const sectionIds = profileSections.map(({ id }) => id);
    let frame = 0;
    let hashRetry = 0;

    const isSectionId = (value: string): value is ProfileSectionId =>
      sectionIds.includes(value as ProfileSectionId);

    const updateFromScroll = () => {
      const anchorLine = 132;
      let nextSection: ProfileSectionId = "account";

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= anchorLine) {
          nextSection = id;
        }
      }

      const reachedBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (reachedBottom) nextSection = sectionIds.at(-1) ?? "rules";

      setActiveSection(nextSection);
      if (window.location.hash !== `#${nextSection}`) {
        window.history.replaceState(null, "", `#${nextSection}`);
      }
    };

    const queueScrollUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateFromScroll);
    };

    const syncHash = (retryAfterRestore = false) => {
      const hash = window.location.hash.slice(1);
      if (!isSectionId(hash)) {
        queueScrollUpdate();
        return;
      }

      setActiveSection(hash);
      const scrollToSection = () =>
        document.getElementById(hash)?.scrollIntoView({ block: "start" });

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToSection();
        });
      });
      if (retryAfterRestore) {
        hashRetry = window.setTimeout(scrollToSection, 200);
      }
    };

    const handleHistoryChange = () => syncHash();

    syncHash(true);
    window.addEventListener("hashchange", handleHistoryChange);
    window.addEventListener("popstate", handleHistoryChange);
    window.addEventListener("scroll", queueScrollUpdate, { passive: true });
    window.addEventListener("resize", queueScrollUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(hashRetry);
      window.removeEventListener("hashchange", handleHistoryChange);
      window.removeEventListener("popstate", handleHistoryChange);
      window.removeEventListener("scroll", queueScrollUpdate);
      window.removeEventListener("resize", queueScrollUpdate);
    };
  }, []);

  return [activeSection, setActiveSection];
}

export default function ProfilePage() {
  const router = useRouter();
  const { language, translate } = useLanguage();
  const identity = useAppIdentity();
  const [activeSection, setActiveSection] = useProfileSectionTracking();
  const [managerName, setManagerName] = useState(identity?.managerName ?? "");
  const [teamName, setTeamName] = useState(identity?.teamName ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [formError, setFormError] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  const managerNameLocked = Boolean(identity?.managerNameChangeAvailableAt);
  const teamNameLocked = (identity?.teamNameChangesRemaining ?? 0) <= 0;
  const hasNameChanges =
    managerName.trim() !== (identity?.managerName ?? "") ||
    teamName.trim() !== (identity?.teamName ?? "");
  const managerInitials = useMemo(
    () => initialsFor(identity?.managerName, "G"),
    [identity?.managerName],
  );
  const teamInitials = useMemo(
    () => initialsFor(identity?.teamName, "PF"),
    [identity?.teamName],
  );

  useEffect(() => {
    if (!hasNameChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasNameChanges]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identity || identity.isGuest || !hasNameChanges || saving) return;

    setSaving(true);
    setFormError("");
    setFormStatus("");
    try {
      const result = await updateFantasyNamesAction({ managerName, teamName });
      const message = translate(result.message);
      if (!result.ok) {
        setFormError(message);
        toast.error(message);
        window.requestAnimationFrame(() => formErrorRef.current?.focus());
        return;
      }

      setFormStatus(message);
      toast.success(message);
      router.refresh();
    } catch {
      const message =
        language === "th"
          ? "บันทึกชื่อไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
          : "Could not save the names. Check your connection and try again.";
      setFormError(message);
      toast.error(message);
      window.requestAnimationFrame(() => formErrorRef.current?.focus());
    } finally {
      setSaving(false);
    }
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

  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader
          title="โปรไฟล์และกติกา"
        />

        <div className="profile-layout">
          <section
            className="profile-overview-card product-card"
            aria-label="ข้อมูลผู้เล่นปัจจุบัน"
          >
            <div className="profile-summary">
              <span className="profile-avatar" aria-hidden="true">
                {managerInitials}
              </span>
              <div className="profile-summary-copy">
                <span className="profile-account-kind">
                  {identity?.isGuest ? "บัญชี Guest" : "บัญชีสมาชิก"}
                </span>
                <strong>{identity?.managerName ?? "—"}</strong>
                <p>ผู้จัดการทีม {identity?.teamName ?? "—"}</p>
              </div>
            </div>
            <div className="profile-account-actions">
              {identity?.isGuest ? (
                <Link href="/upgrade" className="primary-button">
                  สมัครสมาชิกเพื่อเก็บทีม
                </Link>
              ) : null}
              <button
                type="button"
                className="secondary-button"
                onClick={signOut}
                disabled={signingOut}
                aria-busy={signingOut}
              >
                {signingOut ? (
                  <LoaderCircle className="spin" size={16} aria-hidden="true" />
                ) : (
                  <LogOut size={16} aria-hidden="true" />
                )}
                {signingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
              </button>
            </div>
          </section>

          <nav
            className="profile-section-nav"
            aria-label="ส่วนต่าง ๆ ของโปรไฟล์"
          >
            {profileSections.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <a
                  href={`#${id}`}
                  className={active ? "active" : undefined}
                  aria-current={active ? "location" : undefined}
                  onClick={() => setActiveSection(id)}
                  key={id}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </a>
              );
            })}
          </nav>

          <div className="profile-sections">
            <form className="profile-name-form" onSubmit={save}>
              <section
                className="product-card settings-card"
                id="account"
                aria-labelledby="account-heading"
              >
                <div className="settings-heading">
                  <span className="settings-icon" aria-hidden="true">
                    <UserRound />
                  </span>
                  <div>
                    <h2 id="account-heading">ข้อมูลบัญชี</h2>
                    <p>
                      {identity?.isGuest
                        ? "Guest ใช้ชื่อสุ่มและเปลี่ยนชื่อไม่ได้"
                        : managerNameLocked
                          ? language === "th"
                            ? `เปลี่ยนชื่อผู้จัดการได้อีกครั้งหลัง ${new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(identity?.managerNameChangeAvailableAt ?? ""))}`
                            : `Manager name can be changed again after ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(identity?.managerNameChangeAvailableAt ?? ""))}`
                          : "เปลี่ยนชื่อผู้จัดการได้ โดยจะเปลี่ยนครั้งถัดไปได้ใน 30 วัน"}
                    </p>
                  </div>
                </div>
                <div className="form-grid">
                  {identity?.isGuest ? (
                    <div className="settings-readonly-field">
                      <span>ชื่อที่แสดง</span>
                      <strong>{identity.managerName}</strong>
                    </div>
                  ) : (
                    <label>
                      <span>ชื่อที่แสดง</span>
                      <input
                        name="managerName"
                        value={managerName}
                        onChange={(event) => setManagerName(event.target.value)}
                        disabled={managerNameLocked}
                        required
                        minLength={3}
                        maxLength={30}
                        autoComplete="nickname"
                        spellCheck={false}
                        aria-describedby="manager-name-help"
                      />
                      <small id="manager-name-help">
                        ใช้ภาษาไทย อังกฤษ ตัวเลข เว้นวรรค และ . _ - ได้ 3–30
                        ตัวอักษร
                      </small>
                    </label>
                  )}
                  <div className="settings-readonly-field">
                    <span>อีเมล</span>
                    <strong>
                      <Mail aria-hidden="true" />
                      {identity?.email ?? "Guest ไม่มีอีเมล"}
                    </strong>
                  </div>
                </div>
              </section>

              <section
                className="product-card settings-card"
                id="team"
                aria-labelledby="team-heading"
              >
                <div className="settings-heading">
                  <span className="settings-icon orange" aria-hidden="true">
                    <Palette />
                  </span>
                  <div>
                    <h2 id="team-heading">ข้อมูลทีม</h2>
                    <p>ชื่อและอัตลักษณ์ทีมแฟนตาซี</p>
                  </div>
                </div>
                <div className="team-brand-editor">
                  <div className="team-crest-preview" aria-hidden="true">
                    {teamInitials}
                  </div>
                  {identity?.isGuest ? (
                    <div className="team-name-readonly">
                      <span>ชื่อทีม</span>
                      <strong>{identity.teamName}</strong>
                      <p>Guest ใช้ชื่อทีมแบบสุ่มและเปลี่ยนไม่ได้</p>
                    </div>
                  ) : (
                    <label>
                      <span>ชื่อทีม</span>
                      <input
                        name="teamName"
                        value={teamName}
                        onChange={(event) => setTeamName(event.target.value)}
                        disabled={teamNameLocked}
                        required
                        minLength={3}
                        maxLength={30}
                        autoComplete="off"
                        spellCheck={false}
                        aria-describedby="team-name-help"
                      />
                      <small id="team-name-help">
                        {teamNameLocked
                          ? "ใช้สิทธิ์เปลี่ยนชื่อทีมครบแล้วสำหรับฤดูกาลนี้"
                          : `เปลี่ยนชื่อทีมได้อีก ${identity?.teamNameChangesRemaining ?? 0} ครั้งในฤดูกาลนี้`}
                      </small>
                    </label>
                  )}
                </div>

                {!identity?.isGuest ? (
                  <div className="profile-save-row">
                    <div className="profile-form-feedback" aria-live="polite">
                      {formError ? (
                        <p ref={formErrorRef} role="alert" tabIndex={-1}>
                          {formError}
                        </p>
                      ) : null}
                      {!formError && formStatus ? <p>{formStatus}</p> : null}
                    </div>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={saving || !hasNameChanges}
                      aria-busy={saving}
                    >
                      {saving ? (
                        <LoaderCircle
                          className="spin"
                          size={17}
                          aria-hidden="true"
                        />
                      ) : (
                        <Save size={17} aria-hidden="true" />
                      )}
                      {saving ? "กำลังบันทึก…" : "บันทึกชื่อบัญชีและทีม"}
                    </button>
                  </div>
                ) : null}
              </section>
            </form>

            <section
              className="product-card settings-card"
              id="language"
              aria-labelledby="language-heading"
            >
              <div className="settings-heading">
                <span className="settings-icon orange" aria-hidden="true">
                  <Languages />
                </span>
                <div>
                  <h2 id="language-heading">ภาษา</h2>
                  <p>เลือกภาษาที่ใช้แสดงผลบนเว็บไซต์</p>
                </div>
              </div>
              <div className="language-settings-row">
                <div>
                  <strong>ภาษาที่ใช้แสดงผล</strong>
                  <span>การตั้งค่านี้จะถูกจดจำในอุปกรณ์เครื่องนี้</span>
                </div>
                <LanguageSwitcher />
              </div>
            </section>

            <section
              className="product-card settings-card rules-card"
              id="rules"
              aria-labelledby="rules-heading"
            >
              <div className="rules-reading-column">
                <div className="settings-heading">
                  <span className="settings-icon purple" aria-hidden="true">
                    <CircleHelp />
                  </span>
                  <div>
                    <h2 id="rules-heading">กติกาเกม</h2>
                    <p>กติกาที่ระบบใช้ตรวจทีมและคำนวณคะแนน</p>
                  </div>
                </div>
                <Accordion className="rules-list" defaultValue={["0"]}>
                  {rules.map((rule, index) => (
                    <AccordionItem value={String(index)} key={rule.title}>
                      <AccordionTrigger>{rule.title}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="rules-points">
                          {rule.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <div className="history-note">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>
                    <strong>ผลย้อนหลังของคุณจะคงเดิม</strong>
                    <span>
                      {
                        "ระบบเก็บระดับ ตำแหน่ง สโมสร และสถานะนักเตะไทยของแต่ละ Gameweek ไว้แยกกัน เพื่อให้คะแนนและประวัติเดิมตรวจสอบได้เสมอ"
                      }
                    </span>
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
