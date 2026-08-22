---
target: หน้าจอ Profile & Rules จากภาพที่ผู้ใช้แคป
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-08-21T19-51-08Z
slug: src-app-profile-page-tsx
---

# Profile & Rules UI Critique

Method: dual-agent (A: profile_critique_a · B: profile_critique_b)

## Design Health Score

| #         | Heuristic                       |     Score | Key issue                                             |
| --------- | ------------------------------- | --------: | ----------------------------------------------------- |
| 1         | Visibility of system status     |       2/4 | URL/เนื้อหาอยู่คนละ section กับ active state          |
| 2         | Match system / real world       |       3/4 | ภาษา Fantasy ดี แต่ข้อความ “snapshots” เป็นภาษาระบบ   |
| 3         | User control and freedom        |       3/4 | มี navigation และ accordion แต่ deep link บางตัวเสีย  |
| 4         | Consistency and standards       |       2/4 | มี navigation และ language control ซ้ำซ้อน            |
| 5         | Error prevention                |       1/4 | หลาย control ดูบันทึกได้แต่ไม่ได้ persist             |
| 6         | Recognition rather than recall  |       3/4 | ป้ายกำกับชัด แต่ current location ผิด                 |
| 7         | Flexibility and efficiency      |       2/4 | กฎสแกนยากและทางเลือกบนหน้ามาก                         |
| 8         | Aesthetic and minimalist design |       2/4 | ภาพรวมเรียบร้อย แต่เนื้อหาและโครงสร้างซ้ำ             |
| 9         | Error recovery                  |       2/4 | บาง action ไม่มี failure recovery หรือ feedback       |
| 10        | Help and documentation          |       3/4 | Rules/Help หาเจอง่าย แต่กฎยังไม่เป็นข้อมูลที่สแกนเร็ว |
| **Total** |                                 | **23/40** | **Acceptable — ต้องแก้จุดสำคัญก่อนถือว่าพร้อม**       |

## Design Specificity Verdict

หน้ามีเอกลักษณ์ PP Thai Fantasy ชัดจาก navy/orange shell, ฟุตบอล, guest team และ numbered rules แต่ส่วน Profile/Settings ด้านในยังคล้าย SaaS settings ทั่วไปมากกว่าเกม Fantasy โดยเฉพาะ white card, icon row และ muted description แบบมาตรฐาน

CLI detector สำหรับ `src/app/profile/page.tsx` คืน `[]` (0 findings) แต่ live browser detector พบ 31 visual markers จาก low contrast, cramped padding, skipped heading และสัญญาณอื่น ๆ บางส่วนเป็น false positive: cream palette และ dark glow เป็นทิศทางที่ DESIGN.md ตั้งใจไว้ ส่วน contrast, heading skip และ touch target มีหลักฐานรองรับจริง ไม่มี user-visible overlay ค้างอยู่ เพราะ subagent thread ไม่รองรับการแสดง `[Human]` tab

## Overall Impression

ภาพแรกดูน่าเชื่อถือและมีแบรนด์ชัด แต่ความไว้ใจลดลงทันทีเมื่อ `#language` อยู่ใน URL ขณะที่ Account Details ยังถูกเลือก และเนื้อหาที่เห็นเป็น Game Rules โอกาสใหญ่ที่สุดคือทำให้หน้ามี current-location model เดียว ลด navigation ซ้อน และจัดกฎให้สแกนได้เร็ว

## What's Working

- navy/orange identity, logo และ football vocabulary ทำให้รู้ทันทีว่าเป็นผลิตภัณฑ์ Fantasy Football
- active state ของเมนูหลักชัดทั้งสี พื้นหลัง ไอคอน และแถบส้ม ไม่ได้พึ่งสีอย่างเดียว
- numbered accordion แบ่งกฎเป็นหัวข้อและใช้ progressive disclosure ได้ดี

## Priority Issues

### P1 — current location ผิดและ deep link บางรายการเสีย

URL เป็น `#language`, เนื้อหาที่มองเห็นเป็น Game Rules แต่ Account Details ถูก highlight เพราะ active class ถูก hard-code ที่ `page.tsx:147` การกด Language เลื่อนได้แต่ active ไม่เปลี่ยน; reload ที่ `#language` เริ่มบนสุด และ Privacy ชี้ไป `#privacy` ที่ไม่มี element รองรับ

**Fix:** ทำ hash/scroll-aware active state, ใส่ `aria-current="location"`, สร้างหรือถอด Privacy anchor และทดสอบ direct reload ทุก hash

**Suggested command:** `$impeccable harden`

### P1 — control บางตัวดูใช้งานและบันทึกได้ แต่ไม่ทำงานจริง

Province, favourite club และ notification switch เปลี่ยนเฉพาะ local state แล้วหายเมื่อ reload; Save ส่งเฉพาะ manager/team names และ Change Crest เป็น enabled button ที่ไม่มี handler นี่เป็นปัญหาความซื่อสัตย์ของ UI มากกว่าความสวย

**Fix:** implement persistence/feedback ให้ครบ หรือ disable/remove พร้อมข้อความ “ยังไม่พร้อมใช้งาน” ที่ตรงไปตรงมา; ครอบ async save ด้วย exception recovery และแสดง validation ใกล้ field

**Suggested command:** `$impeccable harden`

### P2 — guest upgrade CTA ถูกตัดในภาษาอังกฤษ

ข้อความ “Create an account to save this team” ถูกตัดเหลือ “Create an account to save…” ในคอลัมน์แคบ ทำให้ primary conversion action ดูเหมือนบั๊ก

**Fix:** อนุญาตให้ wrap 2 บรรทัด, ย่อ copy หรือย้าย CTA ไป surface ที่กว้างกว่า และทดสอบ English ที่ 200% zoom

**Suggested command:** `$impeccable adapt`

### P2 — กฎอ่านยากเพราะบรรทัดกว้างและยัดหลายเงื่อนไขในย่อหน้าเดียว

Squad Selection รวมจำนวนผู้เล่น, formation, club quota, foreign-player quota และ dual nationality ไว้ใน paragraph เดียวบน measure ที่กว้างมาก ผู้ใช้ที่มาหาคำตอบข้อเดียวต้องอ่านทั้งบล็อก

**Fix:** จำกัด text measure ราว 60–70 ตัวอักษรต่อบรรทัด และแยกเป็น labeled facts/bullets เช่น Squad size, Starting XI, Club limit, Foreign limit

**Suggested command:** `$impeccable layout`

### P2 — contrast และลำดับตัวอักษรยังไม่ผ่านคุณภาพที่ควร

ข้อความรองหลายจุดมี contrast ราว 2.8:1 และ rule copy ราว 4.09:1 ต่ำกว่า 4.5:1 สำหรับ normal text; DOM ยังมี heading skip จาก h1 ไป h3 ก่อน h2

**Fix:** ทำ semantic muted token ให้เข้มขึ้น, ตรวจ CTA/active text และเรียง heading hierarchy ใหม่โดยไม่ใช้ระดับ heading เพื่อแต่งขนาด

**Suggested command:** `$impeccable audit`

## Cognitive Load

ระดับปานกลาง (ผิด 3/8 ข้อ): single focus, chunking และ minimal choices หน้าเดียวมี global sidebar, profile navigation, guest actions และ rules พร้อมกัน ขณะที่กฎแรกยังไม่ chunk เป็นข้อย่อย

## Persona Red Flags

- **Alex (Power User):** active state ผิดและ navigation ซ้ำทำให้ scan ช้า; กฎแบบ paragraph ทำให้หาข้อจำกัดเฉพาะจุดยาก
- **Sam (Accessibility):** secondary text contrast ต่ำ, heading skip และ touch targets 38–40px บางรายการ; keyboard/focus ยังต้องทดสอบต่อ
- **Jordan (First-timer):** language controls สองจุด, identity ซ้ำสองตำแหน่ง และ active state ขัดกับเนื้อหาทำให้ mental model สับสน; “snapshots” เป็น jargon

## Minor Observations

- avatar “PK” ไม่สัมพันธ์กับ guest identity ที่แสดง และ profile identity ซ้ำกับ sidebar footer
- orange lock note ดูคล้าย warning ทั้งที่เป็นข้อมูลทั่วไป
- accordion separators เข้มเกินระบบเส้นขอบส่วนอื่นและแย่งสายตาจากหัวข้อ
- mobile ไม่มี page-level overflow แต่ section nav เลื่อนแนวนอน; target สูง 38px และ select 40px ต่ำกว่าแนวทางประมาณ 44px
- collapsed select แสดง raw values `bangkok` และ `port` แทน localized labels

## Questions to Consider

- Account management และ immutable Game Rules ควรอยู่ใน destination เดียวกันจริงหรือไม่?
- Historical integrity จะสื่อเป็นประโยชน์ต่อผู้ใช้แทนภาษาฐานข้อมูลอย่าง “snapshots” ได้อย่างไร?
- Profile navigation ด้านซ้ายช่วยให้เดินทางเร็วขึ้นจริง หรือกำลังเป็น app shell ชั้นที่สอง?
