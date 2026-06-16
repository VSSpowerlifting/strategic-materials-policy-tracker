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
