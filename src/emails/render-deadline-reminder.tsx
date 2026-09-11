import { render, toPlainText } from "react-email";

import DeadlineReminderEmail, {
  deadlineReminderPreviewText,
  deadlineReminderSubject,
  type DeadlineReminderEmailProps,
} from "./deadline-reminder";

export type RenderedDeadlineReminderEmail = {
  subject: string;
  previewText: string;
  html: string;
  text: string;
};

export async function renderDeadlineReminderEmail(
  props: DeadlineReminderEmailProps,
): Promise<RenderedDeadlineReminderEmail> {
  const html = await render(<DeadlineReminderEmail {...props} />);

  return {
    subject: deadlineReminderSubject(props.gameweekNumber),
    previewText: deadlineReminderPreviewText(props.gameweekNumber),
    html,
    text: toPlainText(html),
  };
}
