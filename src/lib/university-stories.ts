export type UniversityStory = {
  tagline: string;
  intro: string;
  highlights: { title: string; body: string; url: string }[];
  consider: string;
  note: string;
  url: string;
};
export const storyCheckedAt = '2026-09-19';
export const universityStories: Record<string, UniversityStory> = {
  uw: {
    tagline: 'Explore CS through projects and research',
    intro:
      'A broad Computer Sciences degree in Madison, with BA and BS routes and opportunities to work with faculty.',
    highlights: [
      {
        title: 'Learn by building',
        body: 'Project-oriented courses cover AI, graphics, security, databases and human-computer interaction.',
        url: 'https://www.cs.wisc.edu/undergraduate/undergrad-program-cs/',
      },
      {
        title: 'Try research as an undergraduate',
        body: 'Faculty-supervised work can take the form of a senior thesis or directed study.',
        url: 'https://www.cs.wisc.edu/undergraduate/undergrad-program-cs/',
      },
    ],
    consider: 'Worth exploring if you want to try several CS areas before choosing a direction.',
    note: 'CS major declaration happens after specified university courses. Admission to the university and declaring the major are separate steps.',
    url: 'https://www.cs.wisc.edu/undergraduate/undergrad-program-cs/',
  },
  waterloo: {
    tagline: 'Connect your studies with work experience',
    intro:
      'Computer Science in Waterloo offers regular and co-op routes, bringing academic study and workplace experience into the same degree.',
    highlights: [
      {
        title: 'Co-op, explained',
        body: 'Co-op alternates study terms with work terms. The regular route is also available.',
        url: 'https://uwaterloo.ca/computer-science/future-undergraduate-students/co-op-and-regular',
      },
      {
        title: 'A place to build with others',
        body: 'Waterloo hosts Hack the North, a hackathon where participants build projects together.',
        url: 'https://uwaterloo.ca/future-students/programs/computer-science',
      },
    ],
    consider: 'Worth exploring if testing different roles during your degree matters to you.',
    note: 'Co-op means planning around work terms and job applications. Do not treat possible earnings as guaranteed funding.',
    url: 'https://uwaterloo.ca/computer-science/future-undergraduate-students/co-op-and-regular',
  },
  gatech: {
    tagline: 'Shape CS around the problems you care about',
    intro:
      'Georgia Tech in Atlanta organizes its CS curriculum into Threads: connected areas of computing and its applications.',
    highlights: [
      {
        title: 'Follow a Thread',
        body: 'Areas include artificial intelligence, cybersecurity, media, theory, and systems and architecture.',
        url: 'https://www.cc.gatech.edu/threads-better-way-learn-computing',
      },
      {
        title: 'Computing starts with people, too',
        body: 'The People Thread focuses on designing and evaluating systems with humans at the center.',
        url: 'https://www.cc.gatech.edu/threads-better-way-learn-computing',
      },
    ],
    consider: 'Worth exploring if you want a computing degree with a clear thematic direction.',
    note: 'Read the course requirements for each Thread before choosing; their names alone do not describe the workload.',
    url: 'https://www.cc.gatech.edu/threads-better-way-learn-computing',
  },
  purdue: {
    tagline: 'Build foundations, then choose your specialty',
    intro:
      'Purdue CS starts with a common foundation, then lets students deepen their knowledge through specialized tracks.',
    highlights: [
      {
        title: 'A shared foundation',
        body: 'Six core courses introduce programming, CS foundations, architecture, algorithms and systems.',
        url: 'https://www.cs.purdue.edu/undergraduate/curriculum/bachelor.html',
      },
      {
        title: 'Room to specialize',
        body: 'Tracks combine advanced required courses and electives. Students may complete more than one track.',
        url: 'https://www.cs.purdue.edu/undergraduate/curriculum/bachelor.html',
      },
    ],
    consider: 'Worth exploring if you prefer a structured foundation before specializing.',
    note: 'Check prerequisites when planning a track: advanced courses build on the core sequence.',
    url: 'https://www.cs.purdue.edu/undergraduate/curriculum/bachelor.html',
  },
  rit: {
    tagline: 'Make work experience part of your degree',
    intro:
      'RIT in Rochester integrates cooperative education into computing degrees, with periods of study and full-time work experience.',
    highlights: [
      {
        title: 'A different study rhythm',
        body: 'The computing co-op page describes Computer Science as a five-year program with three required co-op blocks.',
        url: 'https://www.rit.edu/computing-co-op',
      },
      {
        title: 'Practice beyond the classroom',
        body: 'Co-op offers full-time, paid workplace experience alongside on-campus study.',
        url: 'https://www.rit.edu/computing-co-op',
      },
    ],
    consider:
      'Worth exploring if an extended degree with substantial work experience fits your plans.',
    note: 'Plan for the longer calendar and check the current CS co-op sequence. A particular employer or income is not promised.',
    url: 'https://www.rit.edu/computing-co-op',
  },
  asu: {
    tagline: 'Explore computing within an engineering school',
    intro:
      'ASU Computer Science belongs to the Ira A. Fulton Schools of Engineering. This PathShift option is the Tempe campus BS route.',
    highlights: [
      {
        title: 'Focused study options',
        body: 'The school lists concentrations in cybersecurity and software engineering.',
        url: 'https://scai.engineering.asu.edu/computer-science-bs/',
      },
      {
        title: 'See the whole course journey',
        body: 'An official major map shows required and elective courses and their recommended sequence.',
        url: 'https://scai.engineering.asu.edu/computer-science-bs/',
      },
    ],
    consider: 'Worth exploring if you want to inspect a semester-by-semester plan before choosing.',
    note: 'ASU also offers an online route. Its delivery format is separate from the Tempe campus option shown here.',
    url: 'https://scai.engineering.asu.edu/computer-science-bs/',
  },
};
