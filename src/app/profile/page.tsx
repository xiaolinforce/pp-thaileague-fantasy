"use client";

import {
  Bell,
  ChevronRight,
  CircleHelp,
  Languages,
  Lock,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { LanguageSwitcher, useLanguage } from "@/components/fantasy/i18n";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const rules = [
  {
    title: "การจัดทีม",
    copy: "แต่ละทีมมีนักเตะ 15 คน แบ่งเป็นผู้รักษาประตู 2 กองหลัง 5 กองกลาง 5 และกองหน้า 3 คน โดยเลือกนักเตะจากสโมสรเดียวกันได้ตามจำนวนที่กำหนด",
  },
  {
    title: "การคิดคะแนน",
    copy: "คะแนนมาจากการลงสนาม ประตู แอสซิสต์ คลีนชีต การเซฟ และโบนัส ส่วนรายละเอียดตัวเลขยังเป็นฉบับร่างและสามารถปรับก่อนเปิดฤดูกาล",
  },
  {
    title: "การซื้อขาย",
    copy: "ได้รับสิทธิ์ซื้อขายฟรีในแต่ละ Gameweek หากใช้เกินจำนวนฟรีอาจถูกหักคะแนน ทั้งนี้กติกาสุดท้ายจะประกาศก่อนเริ่มเกม",
  },
  {
    title: "กัปตันและตัวสำรอง",
    copy: "กัปตันได้รับคะแนนคูณสอง รองกัปตันจะทำหน้าที่แทนหากกัปตันไม่ได้ลงสนาม ระบบจะเปลี่ยนตัวสำรองอัตโนมัติตามลำดับ",
  },
];

export default function ProfilePage() {
  const { language } = useLanguage();
  const [province, setProvince] = useState("กรุงเทพมหานคร");
  const [favouriteClub, setFavouriteClub] = useState("การท่าเรือ");
  const [notifications, setNotifications] = useState({
    deadline: true,
    price: true,
    news: false,
  });
  const save = () => {
    toast.success(language === "th" ? "บันทึกการตั้งค่าแล้ว" : "Settings saved");
  };

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="บัญชีของฉัน"
          title="โปรไฟล์และการตั้งค่า"
          description="จัดการข้อมูลทีม การแจ้งเตือน และอ่านกติกาของเกม"
          actions={
            <button className="primary-button" onClick={save}>
              <Save size={17} />
              บันทึกการเปลี่ยนแปลง
            </button>
          }
        />

        <div className="profile-layout">
          <aside className="profile-nav-card product-card">
            <div className="profile-identity">
              <span>PK</span>
              <h3>Piyawat K.</h3>
              <p>ผู้จัดการ PIYA FC</p>
              <small>เข้าร่วมเมื่อ ส.ค. 2026</small>
            </div>
            <nav>
              <a href="#account" className="active">
                <UserRound />
                ข้อมูลบัญชี <ChevronRight />
              </a>
              <a href="#team">
                <Palette />
                ข้อมูลทีม <ChevronRight />
              </a>
              <a href="#notifications">
                <Bell />
                การแจ้งเตือน <ChevronRight />
              </a>
              <a href="#language">
                <Languages />
                ภาษา <ChevronRight />
              </a>
              <a href="#rules">
                <CircleHelp />
                กติกาเกม <ChevronRight />
              </a>
              <a href="#privacy">
                <ShieldCheck />
                ความเป็นส่วนตัว <ChevronRight />
              </a>
            </nav>
          </aside>
          <div className="profile-sections">
            <section className="product-card settings-card" id="account">
              <div className="settings-heading">
                <span className="settings-icon">
                  <UserRound />
                </span>
                <div>
                  <h2>ข้อมูลบัญชี</h2>
                  <p>ข้อมูลที่ใช้แสดงในเกม</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span>ชื่อที่แสดง</span>
                  <input defaultValue="Piyawat K." />
                </label>
                <label>
                  <span>อีเมล</span>
                  <div className="input-with-icon">
                    <Mail />
                    <input defaultValue="piyawat@example.com" />
                  </div>
                </label>
                <label>
                  <span>จังหวัด</span>
                  <Select
                    value={province}
                    onValueChange={(value) => value && setProvince(String(value))}
                  >
                    <SelectTrigger className="settings-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="กรุงเทพมหานคร">กรุงเทพมหานคร</SelectItem>
                      <SelectItem value="เชียงใหม่">เชียงใหม่</SelectItem>
                      <SelectItem value="ชลบุรี">ชลบุรี</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label>
                  <span>ทีมโปรด</span>
                  <Select
                    value={favouriteClub}
                    onValueChange={(value) => value && setFavouriteClub(String(value))}
                  >
                    <SelectTrigger className="settings-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="การท่าเรือ">การท่าเรือ</SelectItem>
                      <SelectItem value="บุรีรัมย์ ยูไนเต็ด">บุรีรัมย์ ยูไนเต็ด</SelectItem>
                      <SelectItem value="บีจี ปทุม">บีจี ปทุม</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
            </section>
            <section className="product-card settings-card" id="language">
              <div className="settings-heading">
                <span className="settings-icon orange">
                  <Languages />
                </span>
                <div>
                  <h2>ภาษา</h2>
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
            <section className="product-card settings-card" id="team">
              <div className="settings-heading">
                <span className="settings-icon orange">
                  <Palette />
                </span>
                <div>
                  <h2>ข้อมูลทีม</h2>
                  <p>ชื่อและอัตลักษณ์ทีมแฟนตาซี</p>
                </div>
              </div>
              <div className="team-brand-editor">
                <div className="team-crest-preview">PF</div>
                <div>
                  <label>
                    <span>ชื่อทีม</span>
                    <input defaultValue="PIYA FC" />
                  </label>
                  <p>เปลี่ยนชื่อทีมได้ไม่เกิน 3 ครั้งต่อฤดูกาล</p>
                </div>
                <button className="secondary-button">เปลี่ยนตราทีม</button>
              </div>
            </section>
            <section className="product-card settings-card" id="notifications">
              <div className="settings-heading">
                <span className="settings-icon green">
                  <Bell />
                </span>
                <div>
                  <h2>การแจ้งเตือน</h2>
                  <p>เลือกข่าวที่คุณไม่อยากพลาด</p>
                </div>
              </div>
              <div className="notification-settings">
                {[
                  {
                    key: "deadline" as const,
                    icon: Smartphone,
                    title: "แจ้งเตือนเดดไลน์",
                    copy: "ก่อนตลาดปิด 24 ชั่วโมงและ 1 ชั่วโมง",
                  },
                  {
                    key: "price" as const,
                    icon: Palette,
                    title: "การเปลี่ยนแปลงราคา",
                    copy: "เมื่อนักเตะในรายการสนใจมีแนวโน้มขึ้นหรือลง",
                  },
                  {
                    key: "news" as const,
                    icon: Bell,
                    title: "ข่าวและโปรโมชัน",
                    copy: "ข่าวสาร กิจกรรม และรางวัลจาก Thai Fantasy",
                  },
                ].map(({ key, icon: Icon, title, copy }) => (
                  <div key={key}>
                    <Icon />
                    <span>
                      <strong>{title}</strong>
                      <small>{copy}</small>
                    </span>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={(checked) =>
                        setNotifications((current) => ({
                          ...current,
                          [key]: checked,
                        }))
                      }
                      aria-label={title}
                    />
                  </div>
                ))}
              </div>
            </section>
            <section
              className="product-card settings-card rules-card"
              id="rules"
            >
              <div className="settings-heading">
                <span className="settings-icon purple">
                  <CircleHelp />
                </span>
                <div>
                  <h2>กติกาเกมฉบับร่าง</h2>
                  <p>รายละเอียดส่วนนี้สามารถปรับได้ก่อนเปิดฤดูกาล</p>
                </div>
              </div>
              <Accordion className="rules-list" defaultValue={["0"]}>
                {rules.map((rule, index) => (
                  <AccordionItem value={String(index)} key={rule.title}>
                    <AccordionTrigger>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {rule.title}
                    </AccordionTrigger>
                    <AccordionContent><p>{rule.copy}</p></AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="draft-note">
                <Lock size={16} />
                <span>
                  <strong>กติกายังไม่ใช่ฉบับสุดท้าย</strong> ระบบ UI
                  แยกจากสูตรคะแนน จึงปรับภายหลังได้โดยไม่กระทบหน้าจอ
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
