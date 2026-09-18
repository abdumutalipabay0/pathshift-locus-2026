import { readFileSync, writeFileSync } from 'node:fs';
const catalog = {};
for (const file of [
  'scripts/catalog.tsv',
  'scripts/domain-catalog.tsv',
  'scripts/journey-catalog.tsv',
  'scripts/research-generated.tsv',
  'scripts/research-ui.tsv',
  'scripts/lab-catalog.tsv',
  'scripts/entry-catalog.tsv',
  'scripts/assistant-catalog.tsv',
  'scripts/university-catalog.tsv',
  'scripts/identity-catalog.tsv',
  'scripts/portfolio-catalog.tsv',
])
  for (const row of readFileSync(file, 'utf8').trim().split(/\r?\n/)) {
    const [en, ru, kk, ...extra] = row.split('\t');
    if (!en || !ru || !kk || extra.length) throw new Error('Invalid translation row: ' + row);
    if (catalog[en] && JSON.stringify(catalog[en]) !== JSON.stringify({ ru, kk }))
      throw new Error('Conflicting translation: ' + en);
    catalog[en] = { ru, kk };
  }
writeFileSync('src/lib/messages.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(
  Object.keys(catalog).length + ' complete RU/KK translations; English is the source catalog.',
);
