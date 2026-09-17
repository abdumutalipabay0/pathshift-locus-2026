// Normalization of supplied freeze, not a web scraper. Exact original reports remain in docs/research.
import { mkdirSync, writeFileSync } from 'node:fs';
const facts = [];
const programs = [];
const rows = [
  [
    'cmu',
    'Carnegie Mellon University',
    'Carnegie Mellon',
    'School of Computer Science',
    'US',
    'Pittsburgh',
    'CM',
    '#A63D40',
    'Apply to SCS; choose your major after enrolment.',
  ],
  [
    'gatech',
    'Georgia Institute of Technology',
    'Georgia Tech',
    'BS Computer Science',
    'US',
    'Atlanta',
    'GT',
    '#796027',
    'First-year admission with an intended major.',
  ],
  [
    'uiuc',
    'University of Illinois Urbana-Champaign',
    'UIUC',
    'BS Computer Science · Grainger',
    'US',
    'Urbana–Champaign',
    'IL',
    '#A7481D',
    'Apply with Computer Science as your chosen major.',
  ],
  [
    'purdue',
    'Purdue University',
    'Purdue',
    'BS Computer Science',
    'US',
    'West Lafayette',
    'PU',
    '#715F3D',
    'Intended-major application; complete rules need verification.',
  ],
  [
    'uw',
    'University of Wisconsin–Madison',
    'UW–Madison',
    'Computer Sciences · BA / BS',
    'US',
    'Madison',
    'W',
    '#BB3C4C',
    'University admission first; declare Computer Sciences later.',
  ],
  [
    'rit',
    'Rochester Institute of Technology',
    'RIT',
    'Computer Science BS',
    'US',
    'Rochester',
    'RIT',
    '#984B18',
    'Program application; English pathway requires verification.',
  ],
  [
    'asu',
    'Arizona State University',
    'Arizona State',
    'Computer Science BS',
    'US',
    'Tempe',
    'AS',
    '#913657',
    'CS may set requirements above the university baseline.',
  ],
  [
    'waterloo',
    'University of Waterloo',
    'Waterloo',
    'Computer Science · Faculty of Mathematics',
    'Canada',
    'Waterloo',
    'W',
    '#795800',
    'IB entry into the Faculty of Mathematics / CS route.',
  ],
  [
    'ubc',
    'University of British Columbia',
    'UBC Vancouver',
    'BSc · Computer Science pathway',
    'Canada',
    'Vancouver',
    'UBC',
    '#315D7B',
    'Enter the Faculty of Science; CS specialization is a later step.',
  ],
  [
    'uoft',
    'University of Toronto',
    'Toronto St George',
    'Computer Science category · BCS',
    'Canada',
    'Toronto',
    'UT',
    '#2D4D7C',
    'Enter the CS admission category; progress to the program after Year 1.',
  ],
  [
    'utsc',
    'University of Toronto Scarborough',
    'Toronto Scarborough',
    'Computer Science · BCS',
    'Canada',
    'Toronto',
    'UTS',
    '#47618B',
    'BCS begins Fall 2027; secondary prerequisites need verification.',
  ],
  [
    'manchester',
    'University of Manchester',
    'Manchester',
    'BSc Computer Science',
    'UK',
    'Manchester',
    'M',
    '#76529B',
    'Exact direct BSc record needs verification; foundation is a separate route.',
  ],
];
const urls = {
  cmu: 'https://coursecatalog.web.cmu.edu/aboutcmu/undergraduateadmission/',
  gatech: 'https://admission.gatech.edu/first-year/standardized-tests',
  uiuc: 'https://www.admissions.illinois.edu/first-year-apply-faq/',
  uw: 'https://admissions.wisc.edu/international/',
  waterloo: 'https://uwaterloo.ca/future-students/admissions/english-language-requirements',
  ubc: 'https://you.ubc.ca/applying-ubc/requirements/english-language-competency/',
  uoft: 'https://future.utoronto.ca/english-language-requirements',
  utsc: 'https://future.utoronto.ca/english-language-requirements',
};
function fact(p, key, value, statement, url, evidence = 'VERIFIED', intake = 'FALL_2027') {
  const id = `${p.id}.${key}`;
  facts.push({
    id,
    field: key,
    value,
    statement,
    source_url: url || null,
    page_title: null,
    retrieved_at: '2026-09-17',
    intake,
    scope: { institution: p.name, program: p.id, applicant_type: 'FIRST_YEAR_INTERNATIONAL' },
    evidence,
    provenance: evidence === 'VERIFIED' ? 'OFFICIAL_FACT' : 'UNKNOWN',
    notes:
      'Normalized from supplied dataset freeze. Source retrieval date reported by research; exact time and original page title not supplied. Statement is a research paraphrase.',
  });
  return id;
}
const atom = (id, label, field, comparator, fid, valueKey, extra = {}) => ({
  id,
  label,
  op: 'ATOM',
  strength: 'HARD',
  facts: fid ? [fid] : [],
  field,
  comparator,
  valueKey,
  ...extra,
});
function unknown(p, key, label, url = null) {
  const f = fact(p, key, null, label, url, 'UNKNOWN');
  return atom(`${p.id}.${key}`, label, `evidence.${key}`, 'EQ', f, undefined, { unknown: true });
}
function english(p, overall, bands) {
  const f = fact(
    p,
    'ielts',
    { overall, ...bands },
    `IELTS Academic: overall ${overall}${
      bands
        ? '; ' +
          Object.entries(bands)
            .map(([k, v]) => `${k} ${v}`)
            .join(', ')
        : ''
    }.`,
    urls[p.id],
  );
  const children = [
    atom(`${p.id}.ielts.overall`, 'IELTS overall', 'ielts.overall', 'GTE', f, 'overall'),
  ];
  for (const [band] of Object.entries(bands || {}))
    children.push(atom(`${p.id}.ielts.${band}`, `IELTS ${band}`, `ielts.${band}`, 'GTE', f, band));
  const r = {
    id: `${p.id}.english`,
    label: 'IELTS Academic requirement',
    op: 'ALL',
    strength: 'HARD',
    facts: [f],
    children,
    action: 'english',
  };
  p.rules.push(r);
  return r;
}
function deadline(p, date, mat, zone, url) {
  const f = fact(
    p,
    'deadlines',
    { application: date, documents: mat },
    `Regular application ${date}; supporting materials ${mat}. ${zone || 'Timezone not frozen'}.`,
    url,
  );
  p.deadlines.push(
    {
      type: 'APPLICATION',
      plan: 'REGULAR',
      date,
      time: zone ? '23:59:00' : null,
      timezone: zone,
      fact: f,
    },
    {
      type: 'DOCUMENT',
      plan: 'REGULAR',
      date: mat,
      time: zone ? '23:59:00' : null,
      timezone: zone,
      fact: f,
    },
  );
}
function cost(p, min, max, currency, complete, url) {
  const f = fact(
    p,
    'reference_cost',
    { min, max, currency, complete },
    `2026–27 published ${complete ? 'annual estimate' : 'tuition/fees and books subtotal'}: ${currency} ${min}–${max}. Not Fall 2027 total cost.`,
    url,
    'VERIFIED',
    '2026_27',
  );
  p.cost = { min, max, currency, year: '2026–27', complete, fact: f };
}
for (const [id, name, short, degree, country, city, initials, color, structure] of rows) {
  const p = {
    id,
    name,
    short,
    degree,
    country,
    city,
    initials,
    color,
    structure,
    tags: [],
    rules: [],
    deadlines: [],
  };
  programs.push(p);
  if (['cmu', 'gatech'].includes(id)) {
    const f = fact(
      p,
      'sat_required',
      true,
      'First-year applicants must submit SAT or ACT; CMU policy is scoped to SCS.',
      urls[id],
    );
    p.rules.push({
      id: `${id}.test`,
      label: 'SAT or ACT required',
      op: 'ANY_OF',
      strength: 'HARD',
      facts: [f],
      action: 'sat',
      children: ['sat', 'act'].map((test) =>
        atom(
          `${id}.${test}`,
          `${test.toUpperCase()} result`,
          `${test}.status`,
          'EQ',
          f,
          undefined,
          { value: 'VALID' },
        ),
      ),
    });
  }
  if (['uiuc', 'uw'].includes(id)) {
    const f = fact(
      p,
      'sat_optional',
      true,
      'SAT/ACT is optional for Fall 2027 first-year applicants.',
      id === 'uw' ? 'https://admissions.wisc.edu/apply-as-a-freshman/' : urls[id],
    );
    p.rules.push(
      atom(`${id}.optional`, 'SAT / ACT is optional', 'sat.status', 'PRESENT', f, undefined, {
        strength: 'INFO',
      }),
    );
  }
  if (['cmu', 'purdue', 'rit', 'asu', 'manchester'].includes(id))
    p.rules.push(
      unknown(
        p,
        'admission_evidence',
        'Complete first-year requirements need verification',
        urls[id],
      ),
    );
  if (id === 'gatech') {
    p.rules.push(
      unknown(
        p,
        'english',
        'Exact USG English method is not frozen',
        'https://admission.gatech.edu/international/first-year',
      ),
      unknown(
        p,
        'credential',
        'Secondary credential assessment needs verification',
        'https://admission.gatech.edu/international/first-year',
      ),
    );
    deadline(
      p,
      '2027-01-06',
      '2027-01-22',
      'APPLICANT_LOCAL',
      'https://admission.gatech.edu/first-year/deadlines',
    );
    p.deadlines.push({ ...p.deadlines[1], type: 'TEST_SCORE' });
  }
  if (id === 'uiuc') {
    p.rules.push(
      unknown(
        p,
        'english',
        'First-year English predicate is not frozen',
        'https://www.admissions.illinois.edu/international-requirements/',
      ),
      unknown(
        p,
        'preparation',
        '15-unit subject pattern needs a complete mapping',
        'https://www.admissions.illinois.edu/general-admission-policies/',
      ),
    );
    deadline(
      p,
      '2027-01-05',
      '2027-01-11',
      'America/Chicago',
      'https://www.admissions.illinois.edu/first-year-dates/',
    );
    cost(p, 62146, 72976, 'USD', true, 'https://www.admissions.illinois.edu/tuition/');
  }
  if (id === 'uw') {
    english(p, 6.5);
    p.rules.push(
      unknown(p, 'documents', 'International secondary documents need verification', urls[id]),
    );
    deadline(
      p,
      '2027-01-15',
      '2027-01-22',
      'America/Los_Angeles',
      'https://admissions.wisc.edu/deadlines/',
    );
    cost(p, 65120, 65120, 'USD', false, 'https://financialaid.wisc.edu/cost-of-attendance/');
  }
  if (id === 'waterloo') {
    const u =
      'https://uwaterloo.ca/future-students/admissions/admission-requirements/computer-science/high-school/international-system/ib';
    const f = fact(
      p,
      'ib',
      {
        ib_total: 32,
        math_aa_hl: 6,
        ib_courses: 6,
        hl_courses: 3,
        ib_diploma: true,
        english_a: true,
      },
      'IB Diploma, six courses, at least three HL; total 32; Math AA HL minimum 6; English A HL or SL. AIF required.',
      u,
    );
    p.rules.push({
      id: 'waterloo.academic',
      label: 'IB academic prerequisites',
      op: 'ALL',
      strength: 'HARD',
      facts: [f],
      children: [
        atom('waterloo.curriculum', 'IB curriculum', 'curriculum', 'EQ', f, undefined, {
          value: 'IB',
        }),
        ...['ib_total', 'math_aa_hl', 'ib_courses', 'hl_courses', 'ib_diploma', 'english_a'].map(
          (k) =>
            atom(
              `waterloo.${k}`,
              k.replaceAll('_', ' '),
              k,
              ['ib_diploma', 'english_a'].includes(k) ? 'EQ' : 'GTE',
              f,
              k,
              { immutable: true },
            ),
        ),
      ],
    });
    english(p, 6.5, { reading: 6, writing: 6.5, listening: 6, speaking: 6.5 });
    p.rules.push(
      atom('waterloo.aif', 'Admission Information Form', 'aif', 'EQ', f, undefined, {
        value: true,
        action: 'aif',
      }),
    );
    deadline(
      p,
      '2027-02-01',
      '2027-02-15',
      null,
      'https://uwaterloo.ca/future-students/admissions/application-deadlines',
    );
    cost(p, 74500, 74500, 'CAD', false, 'https://uwaterloo.ca/future-students/financing/tuition');
  }
  if (['ubc', 'uoft', 'utsc'].includes(id)) {
    english(p, 6.5, { reading: 6, writing: 6, listening: 6, speaking: 6 });
    p.rules.push(unknown(p, 'academic', 'Curriculum-specific academic mapping is not frozen'));
  }
  if (['uoft', 'utsc'].includes(id)) {
    const f = fact(
      p,
      'senior_english',
      true,
      'Senior-level academic English is required independently of English-language facility.',
      urls[id],
    );
    p.rules.push(
      atom(
        `${id}.senior_english`,
        'Senior academic English',
        'senior_english',
        'EQ',
        f,
        undefined,
        { unknown: true },
      ),
    );
  }
  if (id === 'ubc') {
    deadline(
      p,
      '2027-01-15',
      '2027-03-15',
      'America/Los_Angeles',
      'https://you.ubc.ca/applying-ubc/dates-deadlines/',
    );
    p.deadlines.push({
      type: 'ENGLISH_SCORE',
      plan: 'REGULAR',
      date: '2027-02-15',
      time: null,
      timezone: null,
      fact: p.deadlines[0].fact,
    });
  }
  if (id === 'cmu')
    cost(
      p,
      96879,
      96879,
      'USD',
      true,
      'https://www.cmu.edu/oie/pre-arrival-and-settling-in/students/instructions/estimated-expenses.html',
    );
  if (['cmu', 'uw', 'uoft', 'ubc'].includes(id)) {
    const postUrls = {
      cmu: 'https://www.cs.cmu.edu/',
      uw: 'https://www.cs.wisc.edu/undergraduate/undergrad-program-cs/',
      uoft: 'https://web.cs.toronto.edu/undergraduate/how-to-apply/cmp1',
      ubc: 'https://you.ubc.ca/programs/computer-science-vancouver-bsc/',
    };
    const f = fact(
      p,
      'progression',
      structure,
      structure,
      postUrls[id],
      id === 'ubc' ? 'PARTIAL' : 'VERIFIED',
    );
    p.rules.push({
      id: `${id}.progression`,
      label: structure,
      op: 'POST_ENROLMENT',
      strength: 'INFO',
      facts: [f],
      children: [],
    });
  }
  if (['waterloo', 'uoft', 'utsc', 'rit'].includes(id)) {
    const name =
      id === 'waterloo'
        ? 'BASE English pathway'
        : id === 'rit'
          ? 'Conditional English route'
          : 'English Language Transition Program';
    const f = fact(
      p,
      'conditional',
      name,
      `${name} exists; complete applicability predicates are not frozen.`,
      urls[id] || 'https://www.rit.edu/admissions/international',
      id === 'rit' ? 'PARTIAL' : 'VERIFIED',
    );
    p.conditional = {
      name,
      fact: f,
      note: 'Availability for your profile needs verification. Route existence does not establish eligibility.',
    };
  }
}
mkdirSync('data', { recursive: true });
writeFileSync(
  'data/dataset.json',
  JSON.stringify({ version: 'freeze-2026-09-17-integrity-1', facts, programs }, null, 2) + '\n',
);
