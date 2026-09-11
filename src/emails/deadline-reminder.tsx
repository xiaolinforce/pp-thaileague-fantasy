import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

export type DeadlineReminderEmailProps = {
  teamName: string;
  gameweekNumber: number;
  deadlineTh: string;
  deadlineEn: string;
  teamUrl: string;
  unsubscribeUrl: string;
};

const colors = {
  orange: "#f56617",
  orangeDeep: "#bd4306",
  orangeSoft: "#fff0e5",
  navy: "#151d24",
  ink: "#182026",
  muted: "#687078",
  line: "#e7e4df",
  warm: "#f6f4f0",
  paper: "#ffffff",
};

const fontFamily =
  '"Leelawadee UI", Tahoma, "Noto Sans Thai", Arial, sans-serif';

export function deadlineReminderSubject(gameweekNumber: number) {
  return `อย่าลืมจัดทีม GW${gameweekNumber} • Lineup reminder`;
}

export function deadlineReminderPreviewText(gameweekNumber: number) {
  return `ตรวจทีม GW${gameweekNumber} ก่อน Deadline • Review your lineup before the deadline`;
}

export const deadlineReminderPreviewProps: DeadlineReminderEmailProps = {
  teamName: "คลองเตย ยูไนเต็ด",
  gameweekNumber: 2,
  deadlineTh: "ศ.ที่ 11 ก.ย. 16:30 น. (เวลาไทย)",
  deadlineEn: "11 Sep 2026, 16:30 (Bangkok time)",
  teamUrl: "https://fantasy.ppfootball.net/team",
  unsubscribeUrl:
    "https://fantasy.ppfootball.net/email/unsubscribe?token=preview",
};

export default function DeadlineReminderEmail({
  teamName,
  gameweekNumber,
  deadlineTh,
  deadlineEn,
  teamUrl,
  unsubscribeUrl,
}: DeadlineReminderEmailProps) {
  const gameweekLabel = `GW${String(gameweekNumber).padStart(2, "0")}`;

  return (
    <Html lang="th">
      <Head />
      <Preview>{deadlineReminderPreviewText(gameweekNumber)}</Preview>
      <Body lang="th" style={body}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandMark}>PP</Text>
            <Text style={brandName}>PP Thai League Fantasy</Text>
          </Section>

          <Section style={content}>
            <Section lang="th">
              <Text style={gameweekPill}>{gameweekLabel}</Text>
              <Heading as="h1" style={heading}>
                ถึงเวลาตรวจทีมของคุณ
              </Heading>
              <Text style={intro}>
                ทีม <strong>{teamName}</strong> ยังปรับตัวจริง ตัวสำรอง กัปตัน
                การย้ายทีม และชิปได้ก่อน Deadline
              </Text>

              <Section style={deadlinePanel}>
                <Text style={deadlineLabel}>Deadline จัดทีม</Text>
                <Text style={deadlineValue}>{deadlineTh}</Text>
              </Section>

              <Text style={checklistTitle}>ก่อนบันทึกทีม อย่าลืมตรวจ</Text>
              <Text style={checklistItem}>
                • ผู้เล่นตัวจริงและลำดับตัวสำรอง
              </Text>
              <Text style={checklistItem}>• กัปตันและรองกัปตัน</Text>
              <Text style={checklistItem}>• การย้ายทีมและชิปที่ต้องการใช้</Text>
            </Section>

            <Hr style={divider} />

            <Section lang="en">
              <Text style={gameweekPill}>{gameweekLabel}</Text>
              <Heading as="h2" style={englishHeading}>
                Time to review your lineup
              </Heading>
              <Text style={intro}>
                You can still update the starters, bench order, captaincy,
                transfers, and chip for <strong>{teamName}</strong> before the
                deadline.
              </Text>

              <Section style={englishDeadlinePanel}>
                <Text style={englishDeadlineLabel}>Lineup deadline</Text>
                <Text style={englishDeadlineValue}>{deadlineEn}</Text>
              </Section>

              <Text style={checklistTitle}>Before saving, check your</Text>
              <Text style={checklistItem}>
                • Starting eleven and bench order
              </Text>
              <Text style={checklistItem}>• Captain and vice-captain</Text>
              <Text style={checklistItem}>• Transfers and active chip</Text>
            </Section>

            <Section style={actionSection}>
              <Button href={teamUrl} style={button}>
                <span lang="th">ไปจัดทีม</span> /{" "}
                <span lang="en">Manage team</span>
              </Button>
              <Text lang="th" style={actionHint}>
                การเปลี่ยนแปลงจะมีผลเมื่อบันทึกทีมสำเร็จเท่านั้น
              </Text>
              <Text lang="en" style={actionHintEnglish}>
                Changes apply only after your team is saved successfully.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text lang="th" style={footerText}>
              คุณได้รับอีเมลนี้เพราะเคยเล่น PP Thai League Fantasy
              และยังไม่ได้ยกเลิกการแจ้งเตือน Deadline
            </Text>
            <Text lang="en" style={footerText}>
              You received this email because you have played PP Thai League
              Fantasy and have not unsubscribed from deadline reminders.
            </Text>
            <Text style={footerText}>
              <span lang="th">ไม่ต้องการรับอีเมลเตือนอีก?</span> /{" "}
              <span lang="en">No more deadline reminders?</span>{" "}
              <a href={unsubscribeUrl} style={unsubscribeLink}>
                <span lang="th">ยกเลิกการแจ้งเตือน</span> /{" "}
                <span lang="en">Unsubscribe</span>
              </a>
            </Text>
            <Text style={footerLegal}>
              <span lang="th">
                PP Thai League Fantasy
                เป็นผลิตภัณฑ์อิสระและไม่ใช่เกมอย่างเป็นทางการของ Thai League
              </span>
              <br />
              <span lang="en">
                PP Thai League Fantasy is an independent product and is not an
                official Thai League game.
              </span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

DeadlineReminderEmail.PreviewProps = deadlineReminderPreviewProps;

const body = {
  backgroundColor: colors.warm,
  color: colors.ink,
  fontFamily,
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0",
  padding: "32px 12px",
};

const container = {
  margin: "0 auto",
  maxWidth: "600px",
  width: "100%",
};

const brandBar = {
  backgroundColor: colors.navy,
  borderRadius: "16px 16px 0 0",
  padding: "20px 28px",
};

const brandMark = {
  backgroundColor: colors.orange,
  borderRadius: "10px",
  color: colors.paper,
  display: "inline-block",
  fontFamily,
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: "36px",
  margin: "0 12px 0 0",
  textAlign: "center" as const,
  width: "44px",
};

const brandName = {
  color: colors.paper,
  display: "inline-block",
  fontFamily,
  fontSize: "17px",
  fontWeight: "600",
  lineHeight: "36px",
  margin: "0",
  verticalAlign: "top",
};

const content = {
  backgroundColor: colors.paper,
  padding: "34px 28px 32px",
};

const gameweekPill = {
  backgroundColor: colors.orangeSoft,
  borderRadius: "999px",
  color: colors.orangeDeep,
  display: "inline-block",
  fontFamily,
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.02em",
  lineHeight: "24px",
  margin: "0 0 14px",
  padding: "2px 11px",
};

const heading = {
  color: colors.ink,
  fontFamily,
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
  lineHeight: "1.35",
  margin: "0 0 12px",
};

const englishHeading = {
  ...heading,
  fontSize: "26px",
};

const intro = {
  color: colors.ink,
  fontFamily,
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 22px",
};

const deadlinePanel = {
  backgroundColor: colors.navy,
  borderRadius: "14px",
  margin: "0 0 24px",
  padding: "18px 20px",
};

const deadlineLabel = {
  color: "#f8c5a8",
  fontFamily,
  fontSize: "13px",
  fontWeight: "600",
  margin: "0 0 3px",
};

const deadlineValue = {
  color: colors.paper,
  fontFamily,
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: "1.45",
  margin: "0",
};

const englishDeadlinePanel = {
  backgroundColor: colors.orangeSoft,
  borderRadius: "14px",
  margin: "0 0 24px",
  padding: "18px 20px",
};

const englishDeadlineLabel = {
  color: colors.orangeDeep,
  fontFamily,
  fontSize: "13px",
  fontWeight: "600",
  margin: "0 0 3px",
};

const englishDeadlineValue = {
  color: colors.ink,
  fontFamily,
  fontSize: "19px",
  fontWeight: "700",
  lineHeight: "1.45",
  margin: "0",
};

const checklistTitle = {
  color: colors.ink,
  fontFamily,
  fontSize: "15px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const checklistItem = {
  color: colors.muted,
  fontFamily,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "3px 0",
};

const divider = {
  borderColor: colors.line,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "30px 0",
};

const actionSection = {
  margin: "30px 0 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: colors.orangeDeep,
  borderRadius: "12px",
  boxSizing: "border-box" as const,
  color: colors.paper,
  display: "block",
  fontFamily,
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "22px",
  padding: "14px 22px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100%",
};

const actionHint = {
  color: colors.muted,
  fontFamily,
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "12px 0 0",
};

const actionHintEnglish = {
  ...actionHint,
  margin: "0",
};

const footer = {
  backgroundColor: "#eeebe6",
  borderRadius: "0 0 16px 16px",
  padding: "24px 28px",
};

const footerText = {
  color: "#545c63",
  fontFamily,
  fontSize: "12px",
  lineHeight: "1.65",
  margin: "0 0 8px",
};

const unsubscribeLink = {
  color: colors.orangeDeep,
  fontWeight: "700",
  textDecoration: "underline",
};

const footerLegal = {
  color: "#545c63",
  fontFamily,
  fontSize: "11px",
  lineHeight: "1.6",
  margin: "18px 0 0",
};
