'use client';
import EntryHeader from './entry-header';
import { useLocale } from './locale-provider';
export default function Privacy() {
  const { tr } = useLocale();
  return (
    <div className="entry-page">
      <EntryHeader />
      <main className="privacy-main">
        <h1>{tr('Your data in PathShift')}</h1>
        <p>
          {tr(
            'Accounts use Neon Auth. Your email and sign-in credentials are handled by the authentication provider; your admission profile is stored in Neon Postgres and is accessible through your signed-in account.',
          )}
        </p>
        <p>
          {tr(
            'Profile drafts, comparison choices and saved scenarios are kept on this browser, separated by account. They do not automatically follow you to another device. The demo uses separate browser storage.',
          )}
        </p>
        <p>
          {tr(
            'The optional AI scenario composer sends the text you enter to CloseRouter. Your full admission profile is not included in that request. Do not enter identity documents or sensitive personal details in the composer.',
          )}
        </p>
        <p>
          {tr(
            'This is a hackathon prototype. Only provide information you are comfortable using in a prototype. You can edit your profile and export it from the workspace.',
          )}
        </p>
      </main>
    </div>
  );
}
