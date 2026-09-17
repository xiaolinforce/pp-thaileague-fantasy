import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/fantasy/app-shell";
import {
  recordDeadlineUnsubscribe,
  unsubscribeUserFromToken,
} from "@/lib/email/deadline-unsubscribe";

type SearchParams = Promise<{ token?: string; done?: string }>;

export default async function DeadlineUnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token = "", done } = await searchParams;
  const valid =
    token.length <= 2048 && Boolean(unsubscribeUserFromToken(token));

  async function unsubscribe(formData: FormData) {
    "use server";
    const submittedToken = formData.get("token");
    if (typeof submittedToken !== "string" || submittedToken.length > 2048) {
      redirect("/email/unsubscribe");
    }
    const userId = unsubscribeUserFromToken(submittedToken);
    if (!userId) redirect("/email/unsubscribe");
    await recordDeadlineUnsubscribe(userId);
    redirect("/email/unsubscribe?done=1");
  }

  return (
    <AppShell>
      <main id="main-content" className="content product-content account-page">
        <section
          className="product-card account-task-card"
          style={{ maxWidth: 560, margin: "64px auto" }}
        >
          <h1>ยกเลิกอีเมลเตือนจัดทีม</h1>
          <p lang="en">Unsubscribe from lineup reminders</p>
          {done === "1" ? (
            <>
              <p>ยกเลิกแล้ว คุณจะไม่ได้รับอีเมลเตือน Deadline อีก</p>
              <p lang="en">You will no longer receive deadline reminders.</p>
            </>
          ) : valid ? (
            <>
              <p>ต้องการหยุดรับอีเมลเตือนการจัดทีมรายสัปดาห์ใช่ไหม?</p>
              <p lang="en">Stop weekly lineup reminder emails?</p>
              <form action={unsubscribe}>
                <input type="hidden" name="token" value={token} />
                <button className="primary-button" type="submit">
                  ยกเลิกการแจ้งเตือน / Unsubscribe
                </button>
              </form>
            </>
          ) : (
            <>
              <p>ลิงก์นี้ไม่ถูกต้อง กรุณาใช้ลิงก์จากอีเมลเตือนฉบับล่าสุด</p>
              <p lang="en">
                This link is invalid. Use the link in your latest reminder.
              </p>
            </>
          )}
          <p>
            <Link href="/team">กลับไปหน้าจัดทีม / Back to team</Link>
          </p>
        </section>
      </main>
    </AppShell>
  );
}
