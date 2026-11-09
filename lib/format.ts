/** Deterministic date formatting (no locale dependence → no hydration drift). */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-09-23" → "23 September 2026". */
export function formatDateLong(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${Number(dd)} ${MONTHS_LONG[Number(mm) - 1]} ${y}`;
}

export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${Number(dd)} ${MONTHS[Number(mm) - 1]} ${y}`;
}

export function formatMonthYear(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm] = m;
  return `${MONTHS[Number(mm) - 1]} ${y}`;
}

export function isoYear(iso: string): string {
  return iso.slice(0, 4);
}

/** Site masthead date, e.g. "2026-11-09" → "Nov 9, 2026". */
export function formatDateUS(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${MONTHS[Number(mm) - 1]} ${Number(dd)}, ${y}`;
}

/** Site footer date, e.g. "2026-11-09" → "November 9, 2026". */
export function formatDateLongUS(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${MONTHS_LONG[Number(mm) - 1]} ${Number(dd)}, ${y}`;
}
