"use server";

import { refresh, updateTag } from "next/cache";
import { transactionDb } from "@/db/transaction";
import { requireAdmin } from "@/lib/auth/context";
import {
  applyMatchImport,
  MatchImportError,
  previewMatchImport,
} from "@/lib/fantasy/match-import-service";

export async function previewMatchAction(fixtureId: string, payload: string) {
  await requireAdmin();
  try {
    const preview = await transactionDb.transaction((tx) =>
      previewMatchImport(tx, fixtureId, payload),
    );
    return { ok: true as const, preview };
  } catch (error) {
    if (error instanceof MatchImportError)
      return {
        ok: false as const,
        message: { th: error.messageTh, en: error.message },
      };
    throw error;
  }
}

export async function applyMatchAction(
  fixtureId: string,
  payload: string,
  token: string,
) {
  const admin = await requireAdmin();
  try {
    const result = await transactionDb.transaction((tx) =>
      applyMatchImport(
        tx,
        fixtureId,
        payload,
        token,
        `${admin.user.email} (${admin.user.id})`,
      ),
    );
    updateTag("competition-dataset");
    updateTag("fixtures-dataset");
    refresh();
    return { ok: true as const, unchanged: result.unchanged };
  } catch (error) {
    if (error instanceof MatchImportError)
      return {
        ok: false as const,
        message: { th: error.messageTh, en: error.message },
      };
    throw error;
  }
}
