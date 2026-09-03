"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "#182026",
          background: "#f6f4f0",
          fontFamily: 'Mitr, "Leelawadee UI", Tahoma, Arial, sans-serif',
        }}
      >
        <main
          role="alert"
          style={{
            width: "min(100%, 520px)",
            padding: "32px 24px",
            border: "1px solid #e7e4df",
            borderRadius: 18,
            background: "#ffffff",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#bd4306" }}>
            PP THAI LEAGUE FANTASY
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 6vw, 36px)" }}>
            ระบบขัดข้องชั่วคราว
          </h1>
          <p style={{ margin: "12px 0 24px", color: "#687078" }}>
            เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง
            <br />
            <span lang="en">Something went wrong. Please try again.</span>
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44,
              padding: "10px 18px",
              border: 0,
              borderRadius: 10,
              color: "#ffffff",
              background: "#c54808",
              font: "inherit",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ลองอีกครั้ง / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
