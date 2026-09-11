import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { deadlineReminderPreviewProps } from "../src/emails/deadline-reminder";
import { renderDeadlineReminderEmail } from "../src/emails/render-deadline-reminder";

const outputDirectory = path.join(process.cwd(), "outputs", "email-preview");

async function renderPreview() {
  const rendered = await renderDeadlineReminderEmail(
    deadlineReminderPreviewProps,
  );

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outputDirectory, "deadline-reminder.html"),
      rendered.html,
      "utf8",
    ),
    writeFile(
      path.join(outputDirectory, "deadline-reminder.txt"),
      rendered.text,
      "utf8",
    ),
    writeFile(
      path.join(outputDirectory, "deadline-reminder.json"),
      `${JSON.stringify(
        {
          subject: rendered.subject,
          previewText: rendered.previewText,
          sampleProps: deadlineReminderPreviewProps,
        },
        null,
        2,
      )}\n`,
      "utf8",
    ),
  ]);

  console.log(`Email preview written to ${outputDirectory}`);
  console.log(`Subject: ${rendered.subject}`);
  console.log(`Preview: ${rendered.previewText}`);
}

renderPreview().catch((error) => {
  console.error("Email preview rendering failed.", error);
  process.exitCode = 1;
});
