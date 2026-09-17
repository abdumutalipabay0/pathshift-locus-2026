import messages from './messages.json';
export const locales = ['kk', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const localeTags: Record<Locale, string> = { kk: 'kk-KZ', ru: 'ru-KZ', en: 'en-US' };
export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && locales.includes(value as Locale);
export function selectLocale(saved: string | undefined, accepted: string | null): Locale {
  if (isLocale(saved)) return saved;
  const preferred = (accepted || '')
    .split(',')
    .map((item) => {
      const [tag, ...parameters] = item.trim().toLowerCase().split(';');
      const q = parameters.find((p) => p.trim().startsWith('q='));
      return { language: tag.split('-')[0], quality: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((item) => Number.isFinite(item.quality) && item.quality > 0)
    .sort((a, b) => b.quality - a.quality);
  for (const item of preferred) if (isLocale(item.language)) return item.language;
  return 'en';
}
type Catalog = Record<string, { ru: string; kk: string }>;
export const catalog = messages as Catalog;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(catalog)
  .filter(([source]) => source.includes('{'))
  .map(([source, translations]) => {
    const names: string[] = [];
    let pattern = '';
    let previous = 0;
    for (const part of source.matchAll(/\{([a-zA-Z]\w*)\}/g)) {
      pattern += escapeRegex(source.slice(previous, part.index)) + '(.+?)';
      names.push(part[1]);
      previous = part.index! + part[0].length;
    }
    return {
      translations,
      names,
      regex: new RegExp('^' + pattern + escapeRegex(source.slice(previous)) + '$'),
      specificity: source.replace(/\{\w+\}/g, '').length,
    };
  })
  .sort((a, b) => b.specificity - a.specificity);
export function translateText(text: string, locale: Locale): string {
  if (locale === 'en' || !text.trim()) return text;
  const key = text.trim().replace(/\s+/g, ' ');
  const entry = Object.hasOwn(catalog, key) ? catalog[key] : undefined;
  if (entry) return text.match(/^\s*/)?.[0] + entry[locale] + (text.match(/\s*$/)?.[0] || '');
  // Templates are matched as whole messages, never as replacements within user-entered content.
  for (const { regex, names, translations } of templates) {
    const match = key.match(regex);
    if (match)
      return translations[locale].replace(/\{(\w+)\}/g, (_, name) => {
        const value = match[names.indexOf(name) + 1];
        if (['name', 'school', 'url', 'year', 'currency'].includes(name)) return value;
        if (['date', 'deadline'].includes(name) && /^\d{4}-\d{2}-\d{2}$/.test(value))
          return formatDate(value, locale);
        if (/^\d+(\.\d+)?$/.test(value)) return formatNumber(Number(value), locale);
        return translateText(value, locale);
      });
  }
  return text;
}
export const formatDate = (date: string, locale: Locale) => {
  const value = new Date(date.length === 10 ? date + 'T12:00:00Z' : date);
  if (locale === 'kk') {
    const months = [
      'қаңтар',
      'ақпан',
      'наурыз',
      'сәуір',
      'мамыр',
      'маусым',
      'шілде',
      'тамыз',
      'қыркүйек',
      'қазан',
      'қараша',
      'желтоқсан',
    ];
    return `${value.getUTCDate()} ${months[value.getUTCMonth()]} ${value.getUTCFullYear()} ж.`;
  }
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
};
export const formatNumber = (n: number, locale: Locale) =>
  new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: 2 }).format(n);
