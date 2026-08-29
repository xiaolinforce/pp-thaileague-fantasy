# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

ผู้ใช้หลักคือแฟนฟุตบอล Thai League 1 ที่ต้องการจัดการทีม Fantasy รายสัปดาห์ ผลิตภัณฑ์ต้องรองรับทั้งผู้ที่คุ้นเคยกับ Fantasy Football และผู้เริ่มต้นซึ่งต้องการเข้าใจกฎ สร้างทีม และเริ่มเล่นได้โดยไม่ต้องสมัครสมาชิกก่อน

## Product Purpose

PP Thai League Fantasy ทำให้แฟนบอลจัดทีมผู้เล่น Thai League 1 จำนวน 15 คน เลือกผู้เล่นตัวจริงและตัวสำรอง จัดการกัปตัน ชิป และการย้ายทีมในแต่ละ Gameweek แล้วแข่งขันด้วยคะแนนจากผลงานการแข่งขันจริง

ความสำเร็จหมายถึงผู้ใช้สามารถเริ่มเล่นได้ง่าย ตัดสินใจจัดทีมได้จากข้อมูลที่เข้าใจได้ และเชื่อถือได้ว่ากฎ คะแนน ตารางคะแนน และประวัติของฤดูกาลถูกเก็บอย่างสม่ำเสมอ

## Positioning

ผลิตภัณฑ์เป็น Fantasy Football ภาษาไทยเป็นหลักสำหรับ Thai League 1 โดยใช้กฎเฉพาะของเกม เช่น tier ผู้เล่น ข้อจำกัดผู้เล่นไทยและต่างชาติ และคะแนน 10 แต้มสำหรับประตูของผู้รักษาประตู พร้อมเก็บ snapshot ของทีมและการจัดประเภทผู้เล่นเพื่อรักษาความถูกต้องของผลย้อนหลัง

PP Thai League Fantasy เป็นผลิตภัณฑ์อิสระ ไม่ใช่เกมอย่างเป็นทางการของ Thai League และต้องไม่สื่อว่ามีการรับรองหรือความร่วมมืออย่างเป็นทางการหากยังไม่มีหลักฐานดังกล่าว

## Operating Context

- ผู้ใช้เริ่มเล่นได้ด้วย Guest account และอัปเกรดเป็นสมาชิกภายหลังได้
- ผู้จัดการเตรียมทีมก่อน deadline ของแต่ละ Gameweek โดยตรวจ squad, formation, captaincy, bench order, chip และผลของการย้ายทีม
- หลังการแข่งขัน ระบบคำนวณคะแนน provisional และ final รวม automatic substitutions, captain fallback, chip และค่าหักจากการย้ายทีม
- ผู้ใช้ติดตามคะแนนราย Gameweek และแข่งขันใน Classic league ตามคะแนนรวมของฤดูกาล
- ผู้ดูแลภายในนำเข้าข้อมูลการแข่งขัน ตรวจ match stats และควบคุม lifecycle ของ Gameweek ก่อนสรุปคะแนน

## Capabilities and Constraints

- ขอบเขตปัจจุบันคือ Thai League 1 ฤดูกาล 2026/27
- รองรับ Passwordless Email OTP, Google OAuth และ Guest account แบบผูกกับอุปกรณ์
- หนึ่งบัญชีมี manager identity หนึ่งรายการและทีมหนึ่งทีมต่อฤดูกาล
- squad มีผู้เล่น 15 คนและต้องผ่านข้อกำหนด formation, club, nationality, tier, deadline, transfer, captaincy และ chip
- ภาษาไทยเป็นภาษาต้นทาง ปัจจุบันภาษาอังกฤษเป็น display preference ฝั่ง client ไม่ใช่ route-level localization
- ข้อมูลการแข่งขันถูกนำเข้าจาก Thai League official API และหน้า squad สาธารณะของ Transfermarkt ก่อน runtime; หน้าเว็บอ่านจากฐานข้อมูลที่ persist แล้ว
- ประวัติทีม คะแนน selection snapshot, transfer revision และ audit context ต้องไม่ถูกเขียนทับจากข้อมูลผู้เล่นปัจจุบัน
- Guest team และประวัติคะแนนต้องคงอยู่แม้ session หมดอายุหรือบัญชีถูกเชื่อมโยงในภายหลัง
- ไม่มีการชำระเงิน เงินรางวัล การพนัน หรือการแข่งขันด้วยเงินจริงในขอบเขตผลิตภัณฑ์
- ผลิตภัณฑ์ยังเป็น prototype; การเปิด production ต้องผ่านงานด้านโดเมน กฎหมาย provider authentication, data operations, monitoring, recovery และ rules acceptance ตาม `ROADMAP.md`
- Native mobile application, live minute-by-minute commentary และ Head-to-head/Cup Fantasy ยังอยู่นอกขอบเขต

## Brand Commitments

- ชื่อผลิตภัณฑ์คือ PP Thai League Fantasy
- ผลิตภัณฑ์ต้องเป็น Thai-first และใช้คำศัพท์ Fantasy Football ที่ผู้ใช้เข้าใจได้
- น้ำเสียงต้องชัดเจน ตรงไปตรงมา และไม่สร้างความเข้าใจผิดเกี่ยวกับสถานะ ความสามารถ การบันทึกข้อมูล หรือความสัมพันธ์อย่างเป็นทางการ
- รายละเอียด visual identity และระบบ interface มีแหล่งอ้างอิงแยกต่างหากใน `DESIGN.md`

## Evidence on Hand

- ข้อมูลการแข่งขัน Thai League 1 และ provenance ของแหล่งข้อมูลถูกบันทึกใน `DATA_SOURCES.md` และ persisted ผ่าน import/seed workflow
- กฎ Fantasy ที่ใช้งานจริงถูกบันทึกใน `DOMAIN.md` และมี executable source of truth ภายใต้ `src/lib/fantasy`
- เส้นทางหลักตั้งแต่ onboarding, team management, points, leagues, fixtures, profile/rules จนถึง internal administration มี implementation ใน `src/app`
- มี automated tests สำหรับกฎ Fantasy, scoring behavior และ email provider routing
- มี club visual identities, player/club data และหน้าจอผลิตภัณฑ์ที่ใช้งานเป็นหลักฐานภายใน repository
- ยังไม่มีหลักฐาน testimonials, จำนวนผู้ใช้งาน, commercial traction, licensing, การรับรองจาก Thai League หรือ production-readiness; งานในอนาคตต้องไม่สร้างข้อความอ้างเหล่านี้ขึ้นเอง

## Product Principles

1. เริ่มเล่นได้เร็ว แต่ไม่แลกกับความเข้าใจในกฎและผลของการตัดสินใจ
2. ใช้ความจริงของ Thai League และกฎเฉพาะของเกม ไม่คัดลอกกฎจาก Fantasy อื่นโดยอัตโนมัติ
3. รักษาความถูกต้องของประวัติทีม คะแนน และตารางอันดับตลอดฤดูกาล
4. แสดงสถานะ ข้อจำกัด และความสามารถของระบบอย่างซื่อสัตย์ โดยไม่สร้าง control หรือคำกล่าวอ้างที่ทำงานไม่จริง
5. ทำภาษาไทยให้สมบูรณ์เป็นลำดับแรก และรักษาความหมายของภาษาอังกฤษให้สอดคล้องกัน

## Accessibility & Inclusion

- ผู้เริ่มต้นต้องเข้าใจกฎ การจัดทีม deadline และผลของ action ได้โดยไม่ต้องมีประสบการณ์ Fantasy มาก่อน
- เส้นทางหลักต้องใช้งานได้ด้วยคีย์บอร์ด มี accessible names และ focus ที่มองเห็นได้
- interface ใช้ responsive system ร่วมกันสามโหมด: Mobile ต่ำกว่า 768px,
  Tablet ตั้งแต่ 768px ถึง 1279px และ Desktop ตั้งแต่ 1280px ขึ้นไป โดยไม่สูญเสียงานหลัก
- ข้อความและสถานะต้องไม่พึ่งสีเพียงอย่างเดียว และต้องอ่านได้ทั้งภาษาไทยและภาษาอังกฤษ
