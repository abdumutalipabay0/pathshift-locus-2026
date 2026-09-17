import type { Evaluation, Profile, Fact } from './types';

export const scenarioFields = [
  'ielts',
  'sat',
  'act',
  'budgets',
  'countries',
  'interest',
  'expected_score_date',
] as const;
export function scenarioMutation(before: Profile, after: Profile): Partial<Profile> {
  return Object.fromEntries(
    scenarioFields
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map((key) => [key, after[key]]),
  );
}
export type SavedScenario = {
  id: string;
  name: string;
  mutation: Partial<Profile>;
  savedAt: string;
};

export function downloadText(text: string, name: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escapeCalendar = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function calendarExport(
  e: Evaluation,
  translate: (s: string) => string = (s) => s,
  facts: Fact[] = [],
): string {
  const rows = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PathShift//Admission journey//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const result of e.programs.filter((r) => e.profile.shortlist.includes(r.program.id))) {
    for (const d of result.program.deadlines) {
      const source = facts.find(
        (f) =>
          f.id === d.fact &&
          f.evidence === 'VERIFIED' &&
          f.intake === e.profile.intake &&
          f.provenance === 'OFFICIAL_FACT',
      );
      if (!source) continue;
      const next = new Date(d.date + 'T12:00:00Z');
      next.setUTCDate(next.getUTCDate() + 1);
      rows.push(
        'BEGIN:VEVENT',
        `UID:${result.program.id}-${d.type}-${d.date}@pathshift`,
        `DTSTAMP:${e.evaluated_at.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`,
        `DTSTART;VALUE=DATE:${d.date.replaceAll('-', '')}`,
        `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll('-', '')}`,
        `SUMMARY:${escapeCalendar(
          result.program.short +
            ' · ' +
            translate(
              d.type
                .toLowerCase()
                .replaceAll('_', ' ')
                .replace(/^./, (c) => c.toUpperCase()),
            ),
        )}`,
        `DESCRIPTION:${escapeCalendar(translate('Calendar dates are reminders. Check the official cutoff and timezone before submitting.') + '\n' + (d.time || '') + ' ' + (d.timezone || translate('Time / timezone not verified')) + '\n' + (source.source_url || ''))}`,
        'END:VEVENT',
      );
    }
  }
  rows.push('END:VCALENDAR');
  // RFC 5545 folds at <=75 UTF-8 octets, without splitting a code point.
  return (
    rows
      .map((row) => {
        let line = '',
          size = 0,
          out = '';
        for (const char of row) {
          const bytes = new TextEncoder().encode(char).length;
          if (size + bytes > 74) {
            out += line + '\r\n ';
            line = '';
            size = 1;
          }
          line += char;
          size += bytes;
        }
        return out + line;
      })
      .join('\r\n') + '\r\n'
  );
}
