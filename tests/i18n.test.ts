import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, translateText, selectLocale, formatDate, formatNumber } from '../src/lib/i18n';
import { dataset, evaluate } from '../src/lib/engine';
import { demoProfile } from '../src/lib/profile';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
test('all static UI messages are translated, apart from intentional proper names and acronyms', () => {
  const preserved = new Set(['pathshift', 'IB', 'IELTS', 'A-Level']);
  for (const file of [
    'src/components/workspace.tsx',
    'src/components/admission-assistant.tsx',
    'src/components/applicant-summary.tsx',
    'src/components/profile-wizard.tsx',
    'src/components/locale-provider.tsx',
    'src/components/journey-extras.tsx',
    'src/components/personal-tools.tsx',
    'src/components/research-details.tsx',
    'src/components/school-fields.tsx',
    'src/components/future-lab.tsx',
    'src/components/landing.tsx',
    'src/components/auth-screen.tsx',
    'src/components/onboarding.tsx',
    'src/components/entry-header.tsx',
    'src/components/privacy.tsx',
  ]) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const walk = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === 'tr' &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const key = node.arguments[0].text.trim();
        if (/[A-Za-z]/.test(key) && !preserved.has(key))
          for (const locale of ['ru', 'kk'] as const)
            assert.notEqual(translateText(key, locale), key, `${file}: ${key}`);
      }
      ts.forEachChild(node, walk);
    };
    walk(source);
  }
});
test('all catalog entries contain both reviewed languages and preserve interpolation variables', () => {
  for (const [en, translations] of Object.entries(catalog))
    for (const lang of ['ru', 'kk'] as const) {
      assert.ok(translations[lang].trim(), en);
      const variables = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      assert.deepEqual(variables(en), variables(translations[lang]), en);
    }
});
test('every active source statement, note, rule label and program structure has a translation', () => {
  for (const locale of ['ru', 'kk'] as const) {
    for (const fact of dataset.facts)
      for (const value of [fact.statement, fact.notes])
        assert.notEqual(translateText(value, locale), value, value);
    for (const program of dataset.programs) {
      assert.notEqual(translateText(program.structure, locale), program.structure);
      assert.notEqual(translateText(program.degree, locale), program.degree);
    }
  }
});
test('all evaluated rule explanations, tasks and diagnosis messages translate without altering data', () => {
  const evaluation = evaluate(demoProfile, '2026-09-17T12:00:00Z'),
    copy = structuredClone(evaluation);
  const walk = (r: (typeof evaluation.programs)[number]['rules'][number]): string[] => [
    r.label,
    r.reason,
    ...r.children.flatMap(walk),
  ];
  const strings = [
    ...evaluation.programs.flatMap((p) => p.rules.flatMap(walk)),
    ...evaluation.roadmap.flatMap((t) => [t.title, t.description]),
    ...Object.values(evaluation.diagnosis).flat(),
  ];
  for (const locale of ['ru', 'kk'] as const)
    for (const text of strings) assert.notEqual(translateText(text, locale), text, text);
  assert.deepEqual(evaluation, copy);
});
test('English stays unchanged and placeholders preserve user names and university identities', () => {
  assert.equal(translateText('Save Waterloo to shortlist', 'en'), 'Save Waterloo to shortlist');
  assert.equal(translateText('Canada’s starting point', 'kk'), 'Бастапқы профиль: Canada');
  assert.equal(
    translateText('Review Waterloo application materials', 'ru'),
    'Проверить документы для Waterloo',
  );
  assert.equal(translateText('constructor', 'kk'), 'constructor');
  assert.equal(translateText('__proto__', 'ru'), '__proto__');
});
test('dates and numbers use selected locale without changing numeric values', () => {
  assert.equal(formatNumber(6.5, 'ru'), '6,5');
  assert.equal(formatNumber(6.5, 'kk'), '6,5');
  assert.match(formatDate('2027-01-15', 'ru'), /2027/);
  assert.notEqual(formatDate('2027-01-15', 'kk'), formatDate('2027-01-15', 'en'));
});
test('locale selection honors explicit supported choice with a safe fallback', () => {
  assert.equal(selectLocale('kk', 'en-US'), 'kk');
  assert.equal(selectLocale(undefined, 'ru-RU,en;q=0.8'), 'ru');
  assert.equal(selectLocale('bad', 'kk-KZ'), 'kk');
  assert.equal(selectLocale(undefined, 'de-DE'), 'en');
  assert.equal(selectLocale(undefined, 'ru;q=0.2,en-US;q=0.9'), 'en');
  assert.equal(selectLocale(undefined, 'en;q=0,KK-KZ;q=0.8'), 'kk');
});
