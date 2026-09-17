import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { LocaleProvider } from '@/components/locale-provider';
import { selectLocale, translateText } from '@/lib/i18n';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/cyrillic-600.css';
import '@fontsource/manrope/cyrillic-700.css';
import '@fontsource/manrope/cyrillic-800.css';
import '@fontsource/manrope/cyrillic-ext-400.css';
import '@fontsource/manrope/cyrillic-ext-600.css';
import '@fontsource/manrope/cyrillic-ext-700.css';
import '@fontsource/manrope/cyrillic-ext-800.css';
import '@fontsource/noto-sans/cyrillic-400.css';
import '@fontsource/noto-sans/cyrillic-500.css';
import '@fontsource/noto-sans/cyrillic-600.css';
import '@fontsource/noto-sans/cyrillic-ext-400.css';
import '@fontsource/noto-sans/cyrillic-ext-500.css';
import '@fontsource/noto-sans/cyrillic-ext-600.css';
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-500.css';
import '@fontsource/noto-sans/latin-600.css';
import './globals.css';
async function requestLocale() {
  return selectLocale(
    (await cookies()).get('pathshift-locale')?.value,
    (await headers()).get('accept-language'),
  );
}
export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return {
    title: translateText('PathShift — Find your next move', locale),
    description: translateText('See where you stand — and what could change your options.', locale),
  };
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await requestLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
