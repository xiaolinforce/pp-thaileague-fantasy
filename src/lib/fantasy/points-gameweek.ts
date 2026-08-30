export type ParsedPointsGameweek = {
  canonical: boolean;
  requested?: number;
  supplied: boolean;
};

export function hasGameweekDeadlinePassed(deadlineAt: Date, now: Date) {
  return deadlineAt.getTime() <= now.getTime();
}

export function parsePointsGameweek(
  value: string | string[] | undefined,
): ParsedPointsGameweek {
  if (value === undefined) {
    return { canonical: true, supplied: false };
  }

  if (Array.isArray(value) || !/^[1-9]\d*$/.test(value)) {
    return { canonical: false, supplied: true };
  }

  const requested = Number(value);
  if (!Number.isSafeInteger(requested)) {
    return { canonical: false, supplied: true };
  }

  return {
    canonical: String(requested) === value,
    requested,
    supplied: true,
  };
}
