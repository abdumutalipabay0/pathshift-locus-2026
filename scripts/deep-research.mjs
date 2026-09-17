import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/dataset.json', 'utf8'));
const translations = [];
const t = (en, ru, kk) => {
  translations.push([en, ru, kk].join('\t'));
  return en;
};
const note = t(
  'Official policy checked 17 September 2026. Published cost years and recurring dates are preserved; admission remains an institutional decision.',
  'Официальные правила проверены 17 сентября 2026. Сохранены годы тарифов и ежегодные даты; решение о приёме принимает вуз.',
  'Ресми талаптар 2026 жылғы 17 қыркүйекте тексерілді. Тариф жылдары мен жыл сайынғы күндер сақталған; қабылдау шешімін университет қабылдайды.',
);
function fact(p, key, value, statement, url, intake = 'FALL_2027') {
  const id = `${p.id}.research.${key}`;
  data.facts.push({
    id,
    field: `research_${key}`,
    value,
    statement,
    source_url: url,
    page_title: p.name,
    retrieved_at: '2026-09-17',
    intake,
    scope: { institution: p.name, program: p.id, applicant_type: 'FIRST_YEAR_INTERNATIONAL' },
    evidence: 'VERIFIED',
    provenance: 'OFFICIAL_FACT',
    notes: note,
  });
  return id;
}
const get = (id) => data.programs.find((p) => p.id === id);
function row(p, key, label, text, url) {
  const id = fact(p, key, text, text, url);
  (p.research ||= []).push({ key, label, text, fact: id, url });
  return id;
}
const labels = {
  academic: t('Academic preparation', 'Школьная подготовка', 'Мектептегі дайындық'),
  english: t('English routes', 'Английский: варианты', 'Ағылшын тілі: жолдар'),
  tests: t('SAT / ACT policy', 'Правила SAT / ACT', 'SAT / ACT талаптары'),
  documents: t('Application documents', 'Документы для подачи', 'Өтінім құжаттары'),
  dates: t('Application dates', 'Сроки подачи', 'Өтінім мерзімдері'),
  cost: t('Published cost breakdown', 'Опубликованные расходы', 'Жарияланған шығындар'),
};
const purdue = get('purdue'),
  rit = get('rit'),
  asu = get('asu'),
  uw = get('uw'),
  gt = get('gatech'),
  waterloo = get('waterloo');
const pu = 'https://admissions.purdue.edu/become-student/';
const ritApply = 'https://www.rit.edu/admissions/first-year-application';
const asuApply = 'https://admission.asu.edu/apply/international/first-year';
const asuCS = 'https://degrees.asu.edu/bachelors/major/ASU00/ESCSEBS/computer-science';
for (const p of [purdue, rit, asu])
  p.rules = p.rules.filter((r) => r.id !== `${p.id}.admission_evidence`);
purdue.structure = t(
  'Apply to Computer Science at West Lafayette; holistic review of school preparation and application.',
  'Подача на Computer Science в West Lafayette; комплексная оценка школьной подготовки и заявки.',
  'West Lafayette кампусындағы Computer Science бағдарламасына өтінім; мектеп дайындығы мен өтінім кешенді бағаланады.',
);
rit.structure = t(
  'Apply directly to Computer Science; a conditional English route is available.',
  'Подача напрямую на Computer Science; доступен условный маршрут по английскому.',
  'Computer Science бағдарламасына тікелей өтінім; ағылшын тілі бойынша шартты жол бар.',
);
const pf = row(
  purdue,
  'academic',
  labels.academic,
  t(
    'English 4 years; math 4; laboratory science 3; social studies 3; world language 2.',
    'Английский — 4 года; математика — 4; лабораторные науки — 3; обществознание — 3; иностранный язык — 2.',
    'Ағылшын тілі — 4 жыл; математика — 4; зертханалық ғылымдар — 3; әлеуметтік пәндер — 3; шет тілі — 2.',
  ),
  pu + 'course-requirements/',
);
const pe = row(
  purdue,
  'english',
  labels.english,
  t(
    'IELTS usually 6.5 overall / 6.0 each; DET usually 115 / 110 each. Tests must be within two years. These are published guidelines, not guaranteed admission cutoffs.',
    'IELTS обычно 6,5 в целом / 6,0 в каждом разделе; DET обычно 115 / 110. Тест не старше двух лет. Это ориентиры вуза, а не гарантия поступления.',
    'IELTS әдетте жалпы 6,5 / әр бөлім 6,0; DET әдетте 115 / әр бөлім 110. Тест екі жылдан аспауы тиіс. Бұл қабылдау кепілдігі емес, университет бағдарлары.',
  ),
  pu + 'english-proficiency/',
);
row(
  purdue,
  'tests',
  labels.tests,
  t(
    'SAT, ACT or CLT considered if submitted; scores must be within five years. No minimum total is stated on the first-year criteria page.',
    'SAT, ACT или CLT учитываются при наличии; результаты не старше пяти лет. На странице критериев нет минимального общего балла.',
    'SAT, ACT немесе CLT тапсырылса ескеріледі; нәтижелер бес жылдан аспауы тиіс. Бірінші курс критерийлерінде жалпы ең төменгі ұпай көрсетілмеген.',
  ),
  pu + 'first-year-criteria/',
);
const pd = row(
  purdue,
  'documents',
  labels.documents,
  t(
    'School records, essay and Purdue questions; English evidence. Kazakhstan: years 8–9 and 10–11 records; graduates also provide the final certificate. Certified English translations. Non-English-speaking countries waive the world-language requirement.',
    'Табели, эссе и вопросы Purdue; подтверждение английского. Казахстан: табели за 8–9 и 10–11 классы; выпускникам также аттестат. Заверенные переводы. Для неанглоязычных стран требование иностранного языка отменено.',
    'Табель, эссе, Purdue сұрақтары және ағылшын дәлелі. Қазақстан: 8–9 және 10–11 сынып табельдері; түлектерге аттестат та қажет. Куәландырылған аударма. Ағылшынтілді емес елдерге шет тілі талабы қолданылмайды.',
  ),
  pu + 'international/',
);
row(
  purdue,
  'dates',
  labels.dates,
  t(
    'November 1: CS priority / Early Action. January 15: regular deadline, only if CS still has space. Published recurring dates; confirm the target cycle in the application portal.',
    '1 ноября: приоритет CS / Early Action. 15 января: обычная подача, если на CS остались места. Ежегодные даты; проверьте нужный набор в личном кабинете.',
    '1 қараша: CS басымдығы / Early Action. 15 қаңтар: CS орындары қалса, жалпы мерзім. Жыл сайынғы күндер; қажетті қабылдау кезеңін жеке кабинеттен тексеріңіз.',
  ),
  'https://admissions.purdue.edu/deadlines/first-year-college-student/',
);
const rf = row(
  rit,
  'academic',
  labels.academic,
  t(
    'CS: four years of math through precalculus; chemistry or physics required. General preparation includes four years of English and three of social studies. Diploma by enrolment; holistic selection.',
    'CS: четыре года математики до precalculus; обязательна химия или физика. Общая подготовка: четыре года английского и три обществознания. Аттестат к зачислению; комплексный отбор.',
    'CS: precalculus деңгейіне дейін төрт жыл математика; химия немесе физика міндетті. Жалпы дайындық: төрт жыл ағылшын, үш жыл әлеуметтік пәндер. Оқуға кіріскенде аттестат қажет; іріктеу кешенді.',
  ),
  ritApply,
);
row(
  rit,
  'english',
  labels.english,
  t(
    'Direct: IELTS 6.5 or DET 120. IELTS 6.0 or below may lead to conditional English study; academic requirements still apply.',
    'Напрямую: IELTS 6,5 или DET 120. IELTS 6,0 и ниже — возможен условный маршрут с английским; академические требования сохраняются.',
    'Тікелей: IELTS 6,5 немесе DET 120. IELTS 6,0 және төмен болса, ағылшынмен шартты жол мүмкін; академиялық талаптар сақталады.',
  ),
  'https://www.rit.edu/admissions/international',
);
row(
  rit,
  'tests',
  labels.tests,
  t(
    'SAT / ACT optional; the application is reviewed holistically with or without scores.',
    'SAT / ACT необязательны; заявка оценивается комплексно с баллами или без них.',
    'SAT / ACT міндетті емес; өтінім ұпаймен де, ұпайсыз да кешенді қаралады.',
  ),
  ritApply,
);
const rd = row(
  rit,
  'documents',
  labels.documents,
  t(
    'Application, essay, school transcript, recommendation and English evidence; no art portfolio for Computer Science.',
    'Заявка, эссе, школьный табель, рекомендация и подтверждение английского; творческое портфолио для Computer Science не требуется.',
    'Өтінім, эссе, мектеп табелі, ұсыным және ағылшын дәлелі; Computer Science үшін өнер портфолиосы қажет емес.',
  ),
  ritApply,
);
row(
  rit,
  'dates',
  labels.dates,
  t(
    'Early Action / ED I: November 1; ED II: January 1; Regular Decision: January 15. Recurring published dates; ED is binding, Early Action is not.',
    'Early Action / ED I: 1 ноября; ED II: 1 января; Regular Decision: 15 января. Опубликованные ежегодные сроки; ED обязывает принять предложение, Early Action — нет.',
    'Early Action / ED I: 1 қараша; ED II: 1 қаңтар; Regular Decision: 15 қаңтар. Жарияланған жыл сайынғы күндер; ED міндеттейді, Early Action міндеттемейді.',
  ),
  ritApply,
);
const af = row(
  asu,
  'academic',
  labels.academic,
  t(
    'International baseline: GPA 3.00 / 4.00. Outside-US schooling: math 4 years and lab science 3. CS aptitude: SAT 1210, ACT 24, competency GPA 3.00 or top 25%; no math/science deficiencies. ASU evaluates equivalency.',
    'Международный минимум: GPA 3,00 / 4,00. Школа вне США: 4 года математики, 3 лабораторных наук. CS: SAT 1210, ACT 24, GPA по профильным предметам 3,00 или топ-25%; без пробелов в математике и науках. Эквивалентность оценивает ASU.',
    'Халықаралық минимум: GPA 3,00 / 4,00. АҚШ-тан тыс мектеп: 4 жыл математика, 3 жыл зертханалық ғылым. CS: SAT 1210, ACT 24, бейіндік GPA 3,00 немесе үздік 25%; математика мен ғылымда тапшылық болмауы тиіс. Баламалылықты ASU бағалайды.',
  ),
  asuCS,
);
const ag = fact(
  asu,
  'international_baseline',
  { gpa: 3, math: 4, science: 3 },
  t(
    'International applicants need a secondary-school GPA equivalent to 3.00 / 4.00; no automatic conversion from IB or national grades is applied.',
    'Иностранным абитуриентам нужен школьный GPA, эквивалентный 3,00 / 4,00; автоматического перевода IB или национальных оценок нет.',
    'Халықаралық талапкердің мектеп GPA көрсеткіші 3,00 / 4,00 баламасына сай болуы тиіс; IB не ұлттық бағалар автоматты түрлендірілмейді.',
  ),
  asuApply,
);
row(
  asu,
  'english',
  labels.english,
  t(
    'Computer Science: IELTS 6.5; DET 105; PTE 58. TOEFL: 79 on the old scale, or 4 overall with 3.5 each on tests from 21 January 2026.',
    'Computer Science: IELTS 6,5; DET 105; PTE 58. TOEFL: 79 по старой шкале или общий 4 и каждый раздел 3,5 для тестов с 21 января 2026.',
    'Computer Science: IELTS 6,5; DET 105; PTE 58. TOEFL: ескі шкалада 79 немесе 2026 жылғы 21 қаңтардан бастап жалпы 4, әр бөлім 3,5.',
  ),
  asuCS,
);
row(
  asu,
  'tests',
  labels.tests,
  t(
    'SAT / ACT can meet a CS aptitude alternative; they do not replace the international GPA or subject requirements.',
    'SAT / ACT могут закрыть один из вариантов критерия CS; они не заменяют международные требования к GPA и предметам.',
    'SAT / ACT CS қабілетінің бір нұсқасын өтей алады; халықаралық GPA мен пән талаптарын алмастырмайды.',
  ),
  asuCS,
);
const ad = row(
  asu,
  'documents',
  labels.documents,
  t(
    'Application and fee, three years of school records, certified English translations and official English scores. Final diploma required for enrolment.',
    'Заявка и сбор, табели за три года, заверенные переводы и официальные баллы английского. Итоговый аттестат необходим к зачислению.',
    'Өтінім мен алым, үш жылдық табель, куәландырылған аудармалар және ресми ағылшын нәтижесі. Оқуға кіріскенде қорытынды аттестат қажет.',
  ),
  asuApply,
);
row(
  asu,
  'dates',
  labels.dates,
  t(
    'Fall 2027: November 1, 2026 priority; January 15, 2027 regular admission date. Apply early for scholarship consideration.',
    'Осень 2027: приоритет — 1 ноября 2026; обычная подача — 15 января 2027. Ранняя подача важна для стипендий.',
    '2027 күз: басымдық — 2026 жылғы 1 қараша; жалпы мерзім — 2027 жылғы 15 қаңтар. Стипендия үшін ерте өтінім маңызды.',
  ),
  'https://admission.asu.edu/apply/first-year/admission',
);
// Reuse already verified original policy statements and URLs for the initial cohort.
for (const [p, keys] of [
  [
    uw,
    {
      academic: 'supplement.secondary_documents',
      english: 'ielts',
      tests: 'sat_optional',
      documents: 'supplement.secondary_documents',
      dates: 'deadlines',
    },
  ],
  [
    gt,
    {
      academic: 'supplement.secondary_documents',
      english: 'supplement.ielts',
      tests: 'sat_required',
      documents: 'supplement.secondary_documents',
      dates: 'deadlines',
    },
  ],
  [
    waterloo,
    {
      academic: 'ib',
      english: 'ielts',
      documents: 'supplement.application_documents',
      dates: 'deadlines',
    },
  ],
]) {
  for (const [key, suffix] of Object.entries(keys)) {
    const f = data.facts.find((f) => f.id === `${p.id}.${suffix}`);
    (p.research ||= []).push({
      key,
      label: labels[key],
      text: f.statement,
      fact: f.id,
      url: f.source_url,
    });
  }
}
function atom(p, key, label, field, f, value, comparator = 'GTE', strength = 'HARD') {
  return {
    id: `${p.id}.research.${key}`,
    label,
    op: 'ATOM',
    strength,
    facts: [f],
    field,
    comparator,
    value,
    immutable: field.startsWith('school.'),
  };
}
const subjectLabels = {
  english: t('School English years', 'Лет школьного английского', 'Мектептегі ағылшын жылдары'),
  math: t('School mathematics years', 'Лет школьной математики', 'Мектептегі математика жылдары'),
  science: t('Laboratory science years', 'Лет лабораторных наук', 'Зертханалық ғылым жылдары'),
  social: t('Social studies years', 'Лет обществознания', 'Әлеуметтік пәндер жылдары'),
  language: t('World language years', 'Лет иностранного языка', 'Шет тілі жылдары'),
  precalculus: t(
    'Math through precalculus',
    'Математика до precalculus',
    'Precalculus деңгейіне дейінгі математика',
  ),
  chemistry_physics: t(
    'Chemistry or physics studied',
    'Изучалась химия или физика',
    'Химия немесе физика оқылды',
  ),
  asu_gpa: t(
    'ASU-equivalent school GPA / 4',
    'Школьный GPA по шкале ASU / 4',
    'ASU шкаласындағы мектеп GPA / 4',
  ),
  competency_gpa: t(
    'ASU competency-course GPA / 4',
    'GPA предметов ASU / 4',
    'ASU бейіндік пәндер GPA / 4',
  ),
};
for (const [key, value] of Object.entries({ english: 4, math: 4, science: 3, social: 3 }))
  purdue.rules.push(atom(purdue, key, subjectLabels[key], `school.${key}`, pf, value));
purdue.rules.push({
  id: 'purdue.research.language',
  label: subjectLabels.language,
  op: 'ANY_OF',
  strength: 'HARD',
  facts: [pf, pd],
  children: [
    atom(purdue, 'language.years', subjectLabels.language, 'school.language', pf, 2),
    atom(
      purdue,
      'language.exemption',
      t(
        'School in a non-English-speaking country',
        'Школа в неанглоязычной стране',
        'Ағылшынтілді емес елдегі мектеп',
      ),
      'school.non_english_country',
      pd,
      true,
      'EQ',
    ),
  ],
});
for (const [key, value] of Object.entries({ math: 4, precalculus: true, chemistry_physics: true }))
  rit.rules.push(
    atom(
      rit,
      key,
      subjectLabels[key],
      `school.${key}`,
      rf,
      value,
      typeof value === 'boolean' ? 'EQ' : 'GTE',
    ),
  );
for (const [key, value] of Object.entries({ math: 4, science: 3, asu_gpa: 3 }))
  asu.rules.push(atom(asu, key, subjectLabels[key], `school.${key}`, ag, value));
asu.rules.push({
  id: 'asu.research.aptitude',
  label: t('CS aptitude alternative', 'Альтернативы критерия CS', 'CS қабілетінің балама шарттары'),
  op: 'ANY_OF',
  strength: 'HARD',
  facts: [af],
  children: [
    atom(asu, 'competency_gpa', subjectLabels.competency_gpa, 'school.competency_gpa', af, 3),
    ...[
      ['sat', 1210],
      ['act', 24],
    ].map(([test, score]) => ({
      id: `asu.research.${test}`,
      label: test.toUpperCase() + ' result',
      op: 'ALL',
      strength: 'HARD',
      facts: [af],
      children: [
        atom(
          asu,
          `${test}.valid`,
          test.toUpperCase() + ' result',
          `${test}.status`,
          af,
          'VALID',
          'EQ',
        ),
        atom(asu, `${test}.score`, test.toUpperCase() + ' result', `${test}.score`, af, score),
      ],
    })),
    atom(
      asu,
      'rank',
      t(
        'Top quarter of graduating class',
        'Верхние 25% выпускного класса',
        'Бітірушілердің үздік 25%-ы',
      ),
      'school.top_quarter',
      af,
      true,
      'EQ',
    ),
  ],
});
for (const [p, f] of [
  [purdue, pd],
  [rit, rd],
  [asu, ad],
])
  p.rules.push({
    ...atom(p, 'documents', 'Secondary documents checklist', 'documents_ready', f, true, 'EQ'),
    immutable: false,
    action: 'documents',
  });
// Purdue publishes guidance, not a hard IELTS cutoff. Require the applicant to confirm
// evidence selected from that policy instead of silently converting guidance into a rejection.
purdue.rules.push(
  atom(
    purdue,
    'english_evidence',
    t(
      'English evidence selected under Purdue policy',
      'Подтверждение английского по правилам Purdue',
      'Purdue талабына сай ағылшын дәлелі',
    ),
    'school.purdue_english_evidence',
    pe,
    true,
    'EQ',
  ),
);
const asuDate = asu.research.find((r) => r.key === 'dates').fact;
asu.deadlines = [
  {
    type: 'APPLICATION',
    plan: 'REGULAR',
    date: '2027-01-15',
    time: null,
    timezone: null,
    fact: asuDate,
  },
];
function cost(p, amount, components, text, url, complete = false) {
  const f = row(p, 'cost', labels.cost, text, url);
  data.facts.find((x) => x.id === f).intake = '2026_27';
  data.facts.find((x) => x.id === f).value = { amount, components };
  p.cost = {
    min: amount,
    max: amount,
    currency: p.country === 'Canada' ? 'CAD' : 'USD',
    year: '2026–27',
    complete,
    fact: f,
    components,
  };
}
cost(
  purdue,
  56748,
  [
    ['Tuition and fees', 36154],
    ['Housing and food', 16734],
    ['Books and supplies', 1090],
    ['Travel and personal', 2770],
  ],
  t(
    '2026–27 international CS: tuition/fees USD 36,154 (includes USD 4,050 CS differential); housing/food 16,734; books 1,090; travel/personal 2,770. Published total 56,748. Insurance and international flights may add costs.',
    '2026–27, иностранный студент CS: обучение/сборы 36 154 USD (включая доплату CS 4 050); жильё/еда 16 734; книги 1 090; дорога/личные 2 770. Итого 56 748. Страховка и международные перелёты могут увеличить расходы.',
    '2026–27, шетелдік CS студенті: оқу/алымдар 36 154 USD (CS үстемесі 4 050 кіреді); тұру/тамақ 16 734; кітап 1 090; жол/жеке шығын 2 770. Барлығы 56 748. Сақтандыру мен халықаралық ұшу қосымша болуы мүмкін.',
  ),
  'https://www.purdue.edu/treasurer/finance/bursar-office/tuition/fee-rates-2026-2027/undergraduate-tuition-and-fees-2026-2027/',
);
cost(
  rit,
  85298,
  [
    ['Tuition and fees', 64608],
    ['Housing and food', 17370],
    ['Other expenses', 2890],
    ['Orientation', 430],
  ],
  t(
    '2026–27: tuition USD 63,508; fees 1,100; housing/food 17,370; other 2,890. Published COA 84,868 plus first-year orientation 430 = 85,298. Health insurance is additional unless waived.',
    '2026–27: обучение 63 508 USD; сборы 1 100; жильё/еда 17 370; прочее 2 890. Бюджет 84 868 плюс ориентация первокурсника 430 = 85 298. Страховка отдельно, если нет освобождения.',
    '2026–27: оқу 63 508 USD; алымдар 1 100; тұру/тамақ 17 370; басқа 2 890. Бюджет 84 868 және бірінші курс таныстыруы 430 = 85 298. Босатылмаса, сақтандыру бөлек.',
  ),
  'https://www.rit.edu/admissions/tuition-and-fees',
);
cost(
  asu,
  69906,
  [
    ['Tuition and fees', 43009],
    ['Housing and food', 18819],
    ['Books and supplies', 1320],
    ['Travel and personal', 3993],
    ['Health insurance', 2765],
  ],
  t(
    '2026–27 published estimate USD 69,906: tuition/fees 43,009; housing/food 18,819; books 1,320; travel/personal 3,993; insurance 2,765. ASU still uses the 2025–26 insurance amount and the highest college fee; your bill may differ.',
    'Оценка 2026–27: 69 906 USD — обучение/сборы 43 009; жильё/еда 18 819; книги 1 320; дорога/личные 3 993; страховка 2 765. ASU пока использует страховку 2025–26 и максимальный сбор колледжа; счёт может отличаться.',
    '2026–27 бағасы: 69 906 USD — оқу/алымдар 43 009; тұру/тамақ 18 819; кітап 1 320; жол/жеке 3 993; сақтандыру 2 765. ASU әзірге 2025–26 сақтандыруын және ең жоғары колледж алымын қолданады; нақты шот өзгеше болуы мүмкін.',
  ),
  'https://admission.asu.edu/cost-aid/international',
);
cost(
  gt,
  56520,
  [
    ['Tuition and fees', 37326],
    ['Housing and food', 14628],
    ['Books and supplies', 800],
    ['Travel and personal', 3766],
  ],
  t(
    '2026–27 international first year, on campus: tuition/fees USD 37,326; housing/food 14,628; books 800; travel/personal 3,766. Published total 56,520; off campus 60,286. Check health insurance separately.',
    '2026–27, иностранный первокурсник в кампусе: обучение/сборы 37 326 USD; жильё/еда 14 628; книги 800; дорога/личные 3 766. Итого 56 520; вне кампуса 60 286. Страховку проверьте отдельно.',
    '2026–27, кампустағы шетелдік бірінші курс: оқу/алымдар 37 326 USD; тұру/тамақ 14 628; кітап 800; жол/жеке 3 766. Барлығы 56 520; кампустан тыс 60 286. Сақтандыруды бөлек тексеріңіз.',
  ),
  'https://finaid.gatech.edu/costs/undergraduate-costs',
);
cost(
  uw,
  66550,
  [
    ['Tuition and fees', 45518],
    ['Housing and food', 14994],
    ['Books and supplies', 1800],
    ['Travel and personal', 3908],
    ['Orientation', 330],
  ],
  t(
    '2026–27 nonresident COA USD 65,120 plus first-year fee 330 and computer allowance 1,100 = 66,550. International fees and insurance are additional. Housing/food 14,994 is included.',
    'Бюджет 2026–27 для нерезидента 65 120 USD плюс сбор первокурсника 330 и компьютер 1 100 = 66 550. Международные сборы и страховка отдельно. Жильё/еда 14 994 уже включены.',
    '2026–27 резидент емес бюджеті 65 120 USD, бірінші курс алымы 330 және компьютер 1 100 = 66 550. Халықаралық алымдар мен сақтандыру бөлек. Тұру/тамақ 14 994 ішіне кіреді.',
  ),
  'https://financialaid.wisc.edu/cost-of-attendance/',
);
cost(
  waterloo,
  90794,
  [
    ['Tuition and fees', 73000],
    ['Books and supplies', 1500],
    ['Housing and food', 16294],
  ],
  t(
    '2026–27, two study terms (8 months): international CS tuition/fees CAD 73,000 + books 1,500 + Village 1 double / meal plan B 16,294 = 90,794. Housing is a selected example; co-op fees, personal costs and travel are additional.',
    '2026–27, два учебных семестра (8 месяцев): CS для иностранцев 73 000 CAD + книги 1 500 + двухместная Village 1 с питанием B 16 294 = 90 794. Выбран один вариант жилья; co-op, личные расходы и дорога отдельно.',
    '2026–27, екі оқу семестрі (8 ай): шетелдік CS оқуы 73 000 CAD + кітап 1 500 + Village 1 екі орындық бөлме, B тамақтануы 16 294 = 90 794. Бұл бір тұру нұсқасы; co-op, жеке шығын мен жол бөлек.',
  ),
  'https://uwaterloo.ca/future-students/financing/tuition',
);
waterloo.cost.additional_sources = ['https://uwaterloo.ca/campus-housing/fees-contracts/residence'];
// Correct gaps discovered while rechecking the original three routes too.
uw.research = uw.research.filter((r) => r.key !== 'academic');
const uf = row(
  uw,
  'academic',
  labels.academic,
  t(
    'Minimum school coursework: English 4 years, math 3, social science 3, natural science 3 and electives 4. Math must include algebra, geometry and advanced math; world language is recommended, not a separate admission gate.',
    'Минимум школьных предметов: английский 4 года, математика 3, обществознание 3, естественные науки 3, предметы по выбору 4. Математика включает алгебру, геометрию и продвинутый курс; иностранный язык рекомендован, но не отдельный барьер при подаче.',
    'Мектеп минимумдары: ағылшын 4 жыл, математика 3, әлеуметтік пәндер 3, жаратылыстану 3, таңдау пәндері 4. Математикада алгебра, геометрия және жоғары деңгейлі курс болуы тиіс; шет тілі ұсынылады, бірақ жеке қабылдау шарты емес.',
  ),
  'https://admissions.wisc.edu/first-year-academic-requirements/',
);
for (const [key, value] of Object.entries({
  english: 4,
  math: 3,
  social: 3,
  natural_science: 3,
  electives: 4,
  math_sequence: true,
}))
  uw.rules.push(
    atom(
      uw,
      key,
      subjectLabels[key] ||
        {
          natural_science: t(
            'Natural science years',
            'Лет естественных наук',
            'Жаратылыстану жылдары',
          ),
          electives: t(
            'Elective course years',
            'Лет предметов по выбору',
            'Таңдау пәндері жылдары',
          ),
          math_sequence: t(
            'Algebra, geometry and advanced math',
            'Алгебра, геометрия и продвинутая математика',
            'Алгебра, геометрия және жоғары математика',
          ),
        }[key],
      `school.${key}`,
      uf,
      value,
      typeof value === 'boolean' ? 'EQ' : 'GTE',
    ),
  );
gt.research = gt.research.filter((r) => r.key !== 'academic');
row(
  gt,
  'academic',
  labels.academic,
  t(
    'International coursework is reviewed in the context of the school system and available rigor. The USG unit list applies to US-system schooling; it is not automatically imposed on an overseas IB applicant.',
    'Международную программу оценивают с учётом школьной системы и доступной сложности. Список предметных единиц USG относится к американской системе; его нельзя автоматически применять к зарубежному IB.',
    'Халықаралық пәндер мектеп жүйесі мен қолжетімді күрделілікке сай бағаланады. USG пән бірліктері АҚШ жүйесіне қатысты; шетелдік IB талапкеріне автоматты қолданылмайды.',
  ),
  'https://admission.gatech.edu/first-year/academic-preparation',
);
const wi =
  'https://uwaterloo.ca/future-students/admissions/admission-requirements/computer-science/high-school/international-system/ib';
waterloo.research = waterloo.research.filter((r) => r.key !== 'academic');
const wf = row(
  waterloo,
  'academic',
  labels.academic,
  t(
    'IB: 32 subject points, excluding diploma bonus points; six courses, at least three HL. Math AA HL at least 6. English A HL/SL or English B HL at least 5. Diploma and AIF required.',
    'IB: 32 балла по предметам без бонусных баллов диплома; шесть предметов, минимум три HL. Math AA HL от 6. English A HL/SL или English B HL от 5. Нужны диплом и AIF.',
    'IB: дипломның бонус ұпайларынсыз пәндерден 32 ұпай; алты пән, кемінде үшеуі HL. Math AA HL кемінде 6. English A HL/SL немесе English B HL кемінде 5. Диплом мен AIF қажет.',
  ),
  wi,
);
const wa = waterloo.rules.find((r) => r.id === 'waterloo.academic');
const total = wa.children.find((r) => r.field === 'ib_total');
total.field = 'ib_subject_total';
total.facts = [wf];
total.value = 32;
delete total.valueKey;
total.label = t(
  'IB subject total excluding bonus points',
  'Сумма IB без бонусных баллов',
  'Бонуссыз IB пән ұпайлары',
);
wa.children = wa.children.filter((r) => r.field !== 'english_a');
wa.children.push({
  id: 'waterloo.research.english_subject',
  label: t(
    'IB English A or English B HL',
    'IB English A или English B HL',
    'IB English A немесе English B HL',
  ),
  op: 'ANY_OF',
  strength: 'HARD',
  facts: [wf],
  children: [
    atom(waterloo, 'english_a', 'english a', 'english_a', wf, true, 'EQ'),
    atom(
      waterloo,
      'english_b',
      t('English B HL score', 'Балл English B HL', 'English B HL ұпайы'),
      'english_b_hl',
      wf,
      5,
    ),
  ],
});
// Totals above are published references or explicit sums, never a 2027–28 price promise.
const gtTest = data.facts.find((f) => f.id === 'gatech.sat_required');
gtTest.statement = t(
  'First-year applicants must submit SAT or ACT scores. No guaranteed-admission score is stated.',
  'Абитуриенты первого курса должны предоставить SAT или ACT. Балл, гарантирующий зачисление, не установлен.',
  'Бірінші курс талапкерлері SAT немесе ACT тапсыруы тиіс. Қабылдауға кепіл ұпай белгіленбеген.',
);
gt.research.find((r) => r.key === 'tests').text = gtTest.statement;
data.facts = data.facts.filter(
  (f) =>
    !['purdue.admission_evidence', 'rit.admission_evidence', 'asu.admission_evidence'].includes(
      f.id,
    ),
);
for (const p of [uw, gt, purdue, rit, asu, waterloo])
  p.research.sort(
    (a, b) => Object.keys(labels).indexOf(a.key) - Object.keys(labels).indexOf(b.key),
  );
purdue.rules.find((r) => r.id === 'purdue.research.english_evidence').immutable = false;
data.version = 'freeze-2026-09-17+deep-research-2';
writeFileSync('data/dataset.json', JSON.stringify(data, null, 2) + '\n');
writeFileSync('scripts/research-generated.tsv', [...new Set(translations)].join('\n') + '\n');
writeFileSync(
  'docs/research/deep-check-2026-09-17.md',
  '# Six-university source check — 17 September 2026\n\nOriginal frozen research remains unchanged. This supplement replaces generic research placeholders with sourced criteria. Recurring dates are displayed without inventing target-cycle timestamps. Academic-year estimates are not next-intake quotes. School inputs are self-reported and do not imply an admissions offer.\n\n' +
    [uw, waterloo, gt, purdue, rit, asu]
      .map(
        (p) =>
          '## ' +
          p.name +
          '\n\n' +
          p.research
            .map((r) => '- **' + r.label + '**: ' + r.text + ' [Official source](' + r.url + ')')
            .join('\n') +
          '\n',
      )
      .join('\n') +
    '\nWaterloo housing cross-check: https://uwaterloo.ca/campus-housing/fees-contracts/residence\n',
);
console.log(
  'Six researched university profiles, source-linked comparison rows and current costs generated.',
);
