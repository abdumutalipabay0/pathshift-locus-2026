# Official-source supplement — 17 September 2026

The user explicitly authorized new web research to resolve gaps. This supplement extends the frozen dataset; the two original reports remain unchanged. These are current published policies, not guarantees that no policy can change before enrolment. Only facts whose applicant/program scope is supported are normalized. No 2026 deadline is rolled forward.

| Finding | Official evidence | Implementation |
|---|---|---|
| Georgia Tech uses approved USG methods; USG minimum IELTS Academic 6, recommended 6.5 | https://admission.gatech.edu/international/first-year and https://www.usg.edu/international-education/esl-programs/english-proficiency-requirements/ | Required minimum and holistic review kept separate. Both sources attached. |
| GT international transcripts vary by curriculum; IB diploma is an enrolment credential | https://admission.gatech.edu/international/first-year | No invented IB minimum; explicit document checklist input. |
| CMU undergraduate IELTS 7.5 overall, subscores 7.5 receive consideration | https://www.cmu.edu/admission/admission/international-applicants | Overall is HARD; subscore preference is not a hard cutoff. |
| RIT undergraduate full IELTS 6.5, conditional 6.0 or below | https://www.rit.edu/admissions/international | English branches added; remaining academic gates retained. |
| ASU CS program-specific IELTS 6.5 | https://degrees.asu.edu/bachelors/major/ASU00/ESCSEBS/computer-science | CS English branch, not a university-wide assumption. |
| Manchester exact 2027 direct BSc course 00560: IELTS 6.5 with all subskills 6.5 | https://www.manchester.ac.uk/study/undergraduate/courses/2027/00560/bsc-computer-science/ | Replaces missing direct-course English, not related foundation/industrial routes. |
| Waterloo second IELTS direct branch: overall 7, each component 6 | https://uwaterloo.ca/future-students/admissions/english-language-requirements | ANY_OF with original direct branch. |
| Waterloo BASE one-term: overall 6, writing 6; CS supported in Mathematics/BASE | https://uwaterloo.ca/bridge-to-academic-success-in-english/language-requirements and https://uwaterloo.ca/bridge-to-academic-success-in-english/about | Conditional route retains academic and AIF gates. No automatic offer, no carried-forward August 2026 date. |
| UW–Madison IB documentation is published | https://admissions.wisc.edu/international/ | Applicant confirms official curriculum-specific records/checklist; no automatic document completion. |
| UIUC accepted first-year English test families, no numeric first-year cutoff established | https://www.admissions.illinois.edu/international-requirements/ | Never import transfer cutoff. |
| Purdue IELTS 6.5/6 components uses qualified wording | https://admissions.purdue.edu/become-student/english-proficiency/ | Informational guidance, not a hard rejection rule. |

Forum discovery: https://www.reddit.com/r/uwaterloo/comments/1gzgfdl and https://www.reddit.com/r/BCGrade12s/comments/1r8m1x0/ were reviewed for pitfalls. They suggested alternate IELTS configurations and curriculum prerequisite issues; official pages were checked independently. No Reddit statement is used as a HARD rule, target-intake cost or deadline.

Rebuild: `node scripts/build-dataset.mjs && node scripts/supplement-dataset.mjs`. Source titles on supplemental facts come from the accessed pages; original frozen facts preserve unknown titles instead of inventing them. A separate provenance note identifies the source and the limits of each change.
