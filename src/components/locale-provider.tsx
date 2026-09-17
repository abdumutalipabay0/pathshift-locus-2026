'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { formatDate, formatNumber, translateText, type Locale } from '@/lib/i18n';
const Context = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: 'en',
  setLocale: () => {},
});
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLanguage] = useState(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translateText('PathShift — Find your next move', locale);
  }, [locale]);
  const setLocale = (next: Locale) => {
    setLanguage(next);
    document.cookie = `pathshift-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };
  return <Context.Provider value={{ locale, setLocale }}>{children}</Context.Provider>;
}
export function useLocale() {
  const { locale, setLocale } = useContext(Context);
  // Only display strings are translated. Arrays, React elements and domain values are untouched.
  const tr = <T,>(value: T): T =>
    typeof value === 'string' ? (translateText(value, locale) as T) : value;
  return {
    locale,
    setLocale,
    tr,
    dateLabel: (value: string) => formatDate(value, locale),
    money: (value: number) => formatNumber(value, locale),
  };
}
export function LanguagePicker() {
  const { locale, setLocale, tr } = useLocale();
  return (
    <label className="language-picker">
      <span className="sr-only">{tr('Interface language')}</span>
      <select
        aria-label={tr('Interface language')}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        <option value="kk" lang="kk">
          Қазақша
        </option>
        <option value="ru" lang="ru">
          Русский
        </option>
        <option value="en" lang="en">
          English
        </option>
      </select>
    </label>
  );
}
