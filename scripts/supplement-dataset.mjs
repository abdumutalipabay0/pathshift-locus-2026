import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/dataset.json', 'utf8'));
const get = (id) => data.programs.find((p) => p.id === id);
function fact(
  p,
  key,
  value,
  statement,
  url,
  title,
  notes = 'Current published policy checked 2026-09-17; recheck before submission. Normalized paraphrase, not a verbatim quotation.',
) {
  const id = `${p.id}.supplement.${key}`;
  data.facts.push({
    id,
    field: key,
    value,
    statement,
    source_url: url,
    page_title: title,
    retrieved_at: '2026-09-17',
    intake: 'FALL_2027',
    scope: { institution: p.name, program: p.id, applicant_type: 'FIRST_YEAR_INTERNATIONAL' },
    evidence: 'VERIFIED',
    provenance: 'OFFICIAL_FACT',
    notes,
  });
  return id;
}
const atom = (id, label, field, fact, key, extra = {}) => ({
  id,
  label,
  op: 'ATOM',
  strength: 'HARD',
  facts: [fact],
  field,
  comparator: 'GTE',
  valueKey: key,
  ...extra,
});
function english(p, score, bands, url, title) {
  const f = fact(
    p,
    'ielts',
    { overall: score, ...bands },
    `IELTS Academic minimum ${score} overall${bands ? '; each component ' + bands.reading : ''}.`,
    url,
    title,
  );
  return {
    id: `${p.id}.english`,
    label: 'IELTS Academic requirement',
    op: 'ALL',
    strength: 'HARD',
    facts: [f],
    action: 'english',
    children: ['overall', ...Object.keys(bands || {})].map((k) =>
      atom(`${p.id}.ielts.${k}`, `IELTS ${k}`, `ielts.${k}`, f, k),
    ),
  };
}
const gt = get('gatech');
gt.rules = gt.rules.filter((r) => r.id !== 'gatech.english' && r.id !== 'gatech.credential');
gt.rules.push(
  english(
    gt,
    6,
    null,
    'https://www.usg.edu/international-education/esl-programs/english-proficiency-requirements/',
    'USG English Proficiency Requirements',
  ),
);
const chain = fact(
  gt,
  'usg_link',
  true,
  'Georgia Tech directs international applicants to USG-approved proficiency methods. Language mastery also receives holistic review.',
  'https://admission.gatech.edu/international/first-year',
  'International First-Year Admission',
);
gt.rules.at(-1).facts.push(chain);
for (const id of ['gatech', 'uw']) {
  const p = get(id);
  p.rules = p.rules.filter((r) => r.id !== `${id}.documents`);
  const url =
    id === 'gatech'
      ? 'https://admission.gatech.edu/international/first-year'
      : 'https://admissions.wisc.edu/international/';
  const f = fact(
    p,
    'secondary_documents',
    true,
    'Secondary academic records are required. The applicant must confirm the curriculum-specific checklist, translations and official delivery.',
    '' + url,
    id === 'gatech'
      ? 'International First-Year Admission'
      : 'International Students Applying to UW–Madison',
  );
  p.rules.push(
    atom(`${id}.documents`, 'Secondary documents checklist', 'documents_ready', f, undefined, {
      comparator: 'EQ',
      value: true,
      action: 'documents',
    }),
  );
}
for (const [id, threshold, url, title, bands] of [
  [
    'cmu',
    7.5,
    'https://www.cmu.edu/admission/admission/international-applicants',
    'International Applicants',
    null,
  ],
  [
    'rit',
    6.5,
    'https://www.rit.edu/admissions/international',
    'International Student Information',
    null,
  ],
  [
    'asu',
    6.5,
    'https://degrees.asu.edu/bachelors/major/ASU00/ESCSEBS/computer-science',
    'Computer Science Degree, BS',
    null,
  ],
  [
    'manchester',
    6.5,
    'https://www.manchester.ac.uk/study/undergraduate/courses/2027/00560/bsc-computer-science/',
    'BSc Computer Science (2027 entry)',
    { reading: 6.5, writing: 6.5, listening: 6.5, speaking: 6.5 },
  ],
]) {
  const p = get(id);
  p.rules.push(english(p, threshold, bands, url, title));
  p.rules.find((r) => r.unknown).label =
    'Remaining academic / application requirements need verification';
}
const waterloo = get('waterloo');
const standard = waterloo.rules.find((r) => r.id === 'waterloo.english');
const f = fact(
  waterloo,
  'ielts_alternative',
  { overall: 7, reading: 6, writing: 6, listening: 6, speaking: 6 },
  'An alternative direct IELTS configuration is overall 7.0 and all components at least 6.0.',
  'https://uwaterloo.ca/future-students/admissions/english-language-requirements',
  'English language requirements',
);
standard.id = 'waterloo.english.standard';
standard.action = undefined;
const direct = {
  id: 'waterloo.english.direct',
  label: 'Direct English route',
  op: 'ANY_OF',
  strength: 'HARD',
  facts: [],
  children: [
    standard,
    {
      id: 'waterloo.english.alternative',
      label: 'Alternative IELTS configuration',
      op: 'ALL',
      strength: 'HARD',
      facts: [f],
      children: ['overall', 'reading', 'writing', 'listening', 'speaking'].map((k) =>
        atom(`waterloo.alt.${k}`, `IELTS ${k}`, `ielts.${k}`, f, k),
      ),
    },
  ],
};
const base = fact(
  waterloo,
  'base_1term',
  { overall: 6, writing: 6 },
  'One-term BASE lists IELTS 6.0 overall and 6.0 writing. Academic requirements and program availability also apply.',
  'https://uwaterloo.ca/bridge-to-academic-success-in-english/language-requirements',
  'English language requirements for BASE',
  'Current threshold checked 2026-09-17. Page also contains an August 2026 transition deadline, which is NOT carried into Fall 2027.',
);
const baseScope = fact(
  waterloo,
  'base_cs',
  true,
  'Computer Science is listed under Mathematics/BASE; the Faculty of Mathematics offers iBASE and one-term BASE. Admission is discretionary.',
  'https://uwaterloo.ca/bridge-to-academic-success-in-english/about',
  'About BASE',
);
waterloo.rules = waterloo.rules.filter((r) => r !== standard);
waterloo.rules.push({
  id: 'waterloo.english',
  label: 'English: direct or BASE pathway',
  op: 'CONDITIONAL_PATH',
  strength: 'HARD',
  facts: [],
  action: 'english',
  direct,
  alternative: {
    id: 'waterloo.base',
    label: 'One-term BASE English thresholds',
    op: 'ALL',
    strength: 'HARD',
    facts: [base, baseScope],
    children: ['overall', 'writing'].map((k) =>
      atom(`waterloo.base.${k}`, `BASE IELTS ${k}`, `ielts.${k}`, base, k),
    ),
  },
});
waterloo.conditional = {
  name: 'One-term BASE English pathway',
  fact: base,
  note: 'Published English thresholds and academic gates are evaluated. Any offer remains at Waterloo’s discretion. 2027 transition deadlines are not inferred.',
};
const wf = fact(
  waterloo,
  'application_documents',
  true,
  'Applicants complete DAE, AIF and the CS Supplementary Information Form and submit required academic records.',
  'https://uwaterloo.ca/computer-science/future-undergraduate-students/applying-admissions',
  'Applying and admissions',
);
waterloo.rules.push(
  atom(
    'waterloo.documents',
    'CS application checklist (DAE / SIF / records)',
    'documents_ready',
    wf,
    undefined,
    { comparator: 'EQ', value: true, action: 'documents' },
  ),
);
const rit = get('rit');
const rDirect = rit.rules.find((r) => r.id === 'rit.english');
const rf = fact(
  rit,
  'conditional_ielts',
  6,
  'IELTS 6.0 or below is considered for conditional undergraduate admission; academic requirements still apply.',
  'https://www.rit.edu/admissions/international',
  'International Student Information',
);
rit.rules = rit.rules.filter((r) => r !== rDirect);
rit.rules.push({
  id: 'rit.english',
  label: 'English: direct or conditional route',
  op: 'CONDITIONAL_PATH',
  strength: 'HARD',
  facts: [],
  action: 'english',
  direct: { ...rDirect, id: 'rit.english.direct' },
  alternative: atom('rit.conditional', 'Conditional IELTS range', 'ielts.overall', rf, undefined, {
    comparator: 'LTE',
  }),
});
rit.conditional = {
  name: 'English Language Center conditional route',
  fact: rf,
  note: 'Academic eligibility still needs verification; meeting the English range does not establish admission.',
};
const purdue = get('purdue');
const pf = fact(
  purdue,
  'ielts_guidance',
  { overall: 6.5, component: 6 },
  'Purdue describes IELTS 6.5 / components 6.0 as a general applicant guideline; it is not encoded as a universal hard cutoff.',
  'https://admissions.purdue.edu/become-student/english-proficiency/',
  'English Proficiency',
);
purdue.rules.push({
  id: 'purdue.guidance',
  label: 'IELTS guidance: usually 6.5, components 6.0',
  op: 'ATOM',
  strength: 'INFO',
  facts: [pf],
});
data.version = 'freeze-2026-09-17+official-supplement-1';
writeFileSync('data/dataset.json', JSON.stringify(data, null, 2) + '\n');
