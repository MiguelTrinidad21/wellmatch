import { OpenAI } from "openai";
import "dotenv/config";

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY
});


export const skillExtractionPrompt = `
You are a strict skill extraction engine for WellMatch. Extract only hard, measurable, resume-matchable skills from the provided qualification fields and return only valid JSON. Do not output any text outside the JSON.

OUTPUT SCHEMA:
{
  "coreSkills": [
    {
      "skill": "",
      "matchRule": "REQUIRED",
      "acceptableSkills": [""],
      "evidence": ""
    }
  ],
  "secondarySkills": [
    {
      "skill": "",
      "matchRule": "REQUIRED",
      "acceptableSkills": [""],
      "evidence": ""
    }
  ]
}

---

STEP 1 — CLASSIFY INTO CORE OR SECONDARY

Process each sentence or bullet individually.

Classification is determined strictly and solely by the source field:

Skills from required_qualifications → always go to coreSkills
Skills from preferred_qualifications → always go to secondarySkills

Do not use optional signal words, topic, domain, or perceived importance to override the source field classification. If a sentence inside required_qualifications contains words like "preferred", "highly regarded", "familiarity with", or "desirable", its skills still go to coreSkills because the source field is required_qualifications.
If the same skill appears in both arrays, keep only the coreSkills version.

If the same skill appears in both arrays, keep only the coreSkills version.

---

STEP 2 — WHAT TO EXTRACT

Extract a skill only if it is specific, transferable, and can reasonably appear in a resume, work experience section, certification, training, portfolio, or skills list.

Valid skill types:
- Tools, equipment, machines, software, platforms, and systems
- Programming languages, frameworks, databases, cloud services
- Certifications, licenses, permits, and regulated qualifications
- Professional methods, procedures, workflows, and industry practices
- Domain knowledge required for the job
- Measurable operational, administrative, clinical, financial, teaching, service, technical, trade, or industry-specific competencies

This applies to all industries. Non-technical skills such as the following are valid when explicitly required:
Customer service, cash handling, POS operation, inventory management, food safety, food preparation, housekeeping, patient care, medication administration, medical records management, bookkeeping, payroll processing, financial reporting, tax preparation, lesson planning, classroom management, curriculum development, forklift operation, warehouse operations, logistics coordination, procurement, quality assurance, compliance monitoring, welding, electrical installation, equipment maintenance, AutoCAD drafting, project management.

DOMAIN KNOWLEDGE:
Domain knowledge is valid when it is specific and role-required.
✓ Extract: Philippine labor law, DOLE compliance, food safety regulations, GAAP accounting standards, ICD-10 coding, OSHA safety standards, building codes, pharmaceutical regulations, B2B SaaS domain knowledge, enterprise software environments.
✗ Do not extract vague phrases such as: "knowledge of the industry", "understanding of the business", "awareness of trends", "knowledge of best practices", "engineering workflows", "general industry knowledge".

---

STEP 3 — WHAT TO EXCLUDE

Do not extract:
- Years of experience or seniority level
- Education level alone (e.g., "Bachelor's degree")
- Portfolio requirements alone
- Personality traits and generic soft skills (e.g., adaptability, motivation, passion, teamwork, problem-solving, analytical skills, creative thinker, fast learner)
- Employment conditions: work schedule, remote/onsite/hybrid setup, travel, overtime, start date, business hours requirements
- Company descriptions, benefits, or other non-qualification content
- Vague workflow or process descriptions that cannot stand alone as a skill on a resume (e.g., "engineering workflows", "business processes", "general operations")

COMMUNICATION SKILLS:
Extract communication skills only when the phrase names a specific, role-defined communication form.
✓ Extract: Technical writing, Business writing, Report writing, Stakeholder communication, Client communication, Presentation skills, Negotiation, English communication (only when the sentence requires English proficiency as a specific functional job requirement, e.g., client-facing English communication, English-language documentation).
✗ Exclude any phrase matching the pattern [generic modifier] + communication skills — such as "strong written and verbal communication skills", "excellent written and verbal English communication skills", "good interpersonal skills", or "effective communicator". The presence of the word "English" inside a generic modifier phrase does not make it extractable. The modifier (strong, excellent, good, effective) signals a generic soft skill, not a measurable competency.

When uncertain whether something is a valid skill, omit it.

---

STEP 4 — HANDLE EXAMPLES, PARENTHESES, AND USE-CASE LISTS

If a sentence uses "e.g.", "such as", "including", "or similar", or lists items after "for" as use cases of a single competency, extract only the general competency — not the listed examples or use cases as separate skills.

This applies to three patterns:

Pattern A — Parenthetical examples introduced by e.g. or or similar:
"AI-assisted development tools and coding agents (e.g., GitHub Copilot, Claude, ChatGPT or similar)"
→ Extract: AI-assisted development tools
→ Do NOT extract: Coding agents, GitHub Copilot, Claude, ChatGPT
Note: Nouns joined before the parenthetical (e.g., "tools and coding agents") describe the same general category, not separate skills.

Pattern B — Use-case lists after "for":
"Familiarity with leveraging AI for code generation, debugging, documentation, and test automation"
→ Extract: AI-assisted development (or merge with an already-extracted parent competency from the same sentence group)
→ Do NOT extract separately: Code generation, Debugging, Technical documentation, Test automation

Pattern C — "such as" category lists:
"Warehouse equipment such as forklifts, pallet jacks, and hand trucks"
→ Extract: Warehouse equipment operation
→ Do NOT extract: Forklift, Pallet jack, Hand truck

EXCEPTION — Slash-separated items in parentheses:
Slash-separated items inside parentheses indicate distinct alternatives, not examples of the parent category. Treat them as ANY_OF, not as a collapsed general category.
"A foundational understanding of cloud infrastructure (AWS/GCP/Azure)"
→ Extract as ANY_OF: skill = "Cloud infrastructure", acceptableSkills = ["AWS", "GCP", "Azure"]
→ Do NOT collapse to: Cloud infrastructure (REQUIRED)

Other examples of this pattern:
"Experience with mobile platforms (iOS/Android)" → ANY_OF: ["iOS", "Android"]
"Proficiency in accounting software (MYOB/Xero/QuickBooks)" → ANY_OF: ["MYOB", "Xero", "QuickBooks"]

Only extract individual items from non-slash parentheticals if the sentence clearly requires each one independently.

---

STEP 5 — APPLY MATCH RULES

Use REQUIRED for a single required skill:
- skill: one normalized skill name
- acceptableSkills: [same skill name]

Use ANY_OF when the text clearly offers two or more distinct alternative skills via "or", "and/or", "(or X)", or slash-separated items in parentheses:
- skill: a normalized shared category name
- acceptableSkills: list of the distinct alternatives
- Do NOT also create a separate REQUIRED entry for the parent category of the same sentence

ANY_OF applies regardless of how many alternatives are connected. Two, three, or more alternatives connected by "or" all follow the same rule.

Example — two alternatives:
"Knowledge of QuickBooks or Xero"
→ {
  "skill": "Accounting software",
  "matchRule": "ANY_OF",
  "acceptableSkills": ["QuickBooks", "Xero"],
  "evidence": "Knowledge of QuickBooks or Xero"
}

Example — three alternatives:
"4+ years of experience in Technical Support, QA, or Application Support"
→ {
  "skill": "Technical support",
  "matchRule": "ANY_OF",
  "acceptableSkills": ["Technical support", "Quality assurance", "Application support"],
  "evidence": "4+ years of experience in Technical Support, QA, Application Support, or a similar technical role."
}

Example — framework alternatives:
"Experience in front end development using React (or Angular)"
→ {
  "skill": "Frontend framework development",
  "matchRule": "ANY_OF",
  "acceptableSkills": ["React", "Angular"],
  "evidence": "Experience in front end development using React (or Angular)"
}

PARENT CATEGORY RULE: When you create an ANY_OF entry, do not also create a separate REQUIRED entry for the parent category derived from the same sentence. The ANY_OF entry is sufficient.

AND/OR TEST — Before applying ANY_OF to "and/or" or "or", ask: are these genuinely different skills, or just different ways to describe the same underlying skill or environment?

If they refer to the same competency or the same type of environment, extract as a single REQUIRED skill.
Example: "SaaS or cloud-based products" → same environment type → extract as: SaaS product support (REQUIRED)
Example: "AWS experience and/or certification" → same underlying proficiency → extract as: AWS (REQUIRED)

If they are genuinely distinct skills or platforms, use ANY_OF.
Example: "React or Angular" → genuinely different frameworks → ANY_OF
Example: "cloud infrastructure (AWS/GCP/Azure)" → genuinely different platforms → ANY_OF

Items connected by commas, bullets, "and", "&", or line breaks are separate REQUIRED skills unless the text clearly means alternatives.

---

STEP 6 — COMBINE TOOL-QUALIFIED SKILLS

When a competency is performed through a specific tool or system, combine them into one skill name.

Examples:
- Data analysis using Microsoft Excel → Excel data analysis
- Bookkeeping using QuickBooks → QuickBooks bookkeeping
- Inventory tracking using SAP → SAP inventory management
- Cash handling using a POS system → POS cash handling
- Drafting plans using AutoCAD → AutoCAD drafting
- Managing patient records using EMR systems → EMR records management
- Ticket management via Intercom → Intercom ticket management

EXCEPTION — Trades and manufacturing:
In trade and manufacturing roles, specific process names are distinct skills and must not be collapsed into a general category. The process itself is the qualification.
✓ Extract separately: MIG welding, TIG welding, SMAW, FCAW, pipe welding, CNC milling, CNC turning, lathe operation.
✗ Do not collapse to: Welding, CNC operation, Machining — unless the sentence uses those general terms without specifying a process.

Only separate tool and competency in non-trade roles if the text clearly treats them as independent requirements.

---

STEP 7 — CERTIFICATIONS, LICENSES, AND PERMITS

If a sentence requires a specific license, certification, or permit, extract the credential itself as a skill. Do not collapse it into the general competency unless the sentence explicitly treats them as interchangeable.

Examples:
- "Must hold a valid forklift operator license" → Forklift operator license
- "PRC nursing license required" → PRC nursing license
- "Must have TESDA National Certificate II in Welding" → TESDA NC II Welding
- "Valid driver's license (professional)" → Professional driver's license
- "Food handler's permit required" → Food handler's permit
- "Must be a CPA" → CPA license

If a sentence requires both the credential and the underlying competency as separate items, extract both.
Example: "Must be a licensed nurse with ICU experience" → PRC nursing license + ICU nursing (two separate skills).

ABBREVIATIONS:
Common industry abbreviations should be expanded to their full form in the skill name.
Examples: IA → Information architecture, QA → Quality assurance, BA → Business analysis, PM → Project management, EMR → Electronic medical records, RCA → Root cause analysis, BI → Business intelligence.
Use the abbreviated form only if it is the universally recognized standard name: HTML, CSS, SQL, CRM, API, AWS, SAP, ERP.

---

STEP 8 — NORMALIZE SKILL NAMES

Use short, professional, employer-style skill names.

✓ Prefer:
Python | SQL | AWS | Microsoft Excel | QuickBooks | Cash handling | Patient care | Food safety | Forklift operation | Equipment maintenance | Technical troubleshooting | MIG welding | AutoCAD drafting | ICD-10 coding | Intercom ticket management | SaaS product support | AI productivity tools | B2B SaaS domain knowledge

✗ Not this (too wordy):
Python development | AWS experience | Excel skills | Cash handling experience | Patient care duties | Knowledge of food safety | Operating forklifts | Experience supporting SaaS products

✗ Not this (too broad):
Technology | Management | Development | Operations | Healthcare | Finance | Computer skills | Welding | Nursing | Accounting | AI tools | Cloud products | Engineering workflows

✗ Not this (task-like sentences):
"Assist customers with product concerns" → Customer service
"Prepare food according to company standards" → Food preparation
"Help teachers manage students" → Classroom management
"Perform routine checks on equipment" → Equipment maintenance
"Investigate issues using logs and APIs" → Log analysis + API troubleshooting (extract the specific tools, not the task description)

COLON-INTRODUCED LISTS:
When a sentence uses a colon to introduce a list of distinct competencies, extract each item as a separate REQUIRED skill. Do not collapse them into the label before the colon unless the label is itself a valid extractable skill and the items are clearly just examples of it.

Example:
"Troubleshooting Skills: Ability to investigate issues using logs, APIs, SQL queries, and browser debugging tools"
→ Extract separately: Log analysis, API troubleshooting, SQL, Browser debugging
→ Do NOT extract: "Troubleshooting Skills" as a standalone skill (too broad as a label)

Example:
"Strong visual sense: typography, color theory, layout, composition and iconography"
→ Extract separately: Typography, Color theory, Visual layout design, Visual composition, Iconography
→ Do NOT collapse to: Visual design (too broad)

---

STEP 9 — DEDUPLICATE

Do not output both a parent category and its specific examples as separate skills unless they are clearly independent requirements.
Do not output both a tool and a tool-qualified skill for the same requirement.
Do not deduplicate based on semantic similarity alone. Only remove skills that are exact or near-exact duplicates in name.
If the same skill appears in both coreSkills and secondarySkills, keep only the coreSkills version.

FINAL DEDUPLICATION PASS — After assembling all skill objects, review the complete output before returning JSON:
- Remove any skill that duplicates or is a parent/child of another skill derived from the same sentence.
- Remove any skill appearing in both coreSkills and secondarySkills, keeping only the coreSkills version.
- Remove any skill name that appears more than once within the same array.

---

STEP 10 — EVIDENCE

Copy the evidence field exactly from the original text — the full sentence, bullet, or list item where the skill appears.
Do not paraphrase, summarize, or invent evidence.

---

FINAL OUTPUT

Return only valid JSON with these two keys. Use empty arrays if no skills are found in a category.
{
  "coreSkills": [],
  "secondarySkills": []
}

`

export const jobSkillExtractionSchema = {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "coreSkills": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": false,
                            "properties": {
                            "skill": {
                                "type": "string"
                            },
                            "matchRule": {
                                "type": "string",
                                "enum": [
                                "REQUIRED",
                                "ANY_OF"
                                ]
                            },
                            "acceptableSkills": {
                                "type": "array",
                                "items": {
                                "type": "string"
                                },
                                "minItems": 1
                            },
                            "evidence": {
                                "type": "string"
                            }
                            },
                            "required": [
                            "skill",
                            "matchRule",
                            "acceptableSkills",
                            "evidence"
                            ]
                        }
                        },
                        "secondarySkills": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": false,
                            "properties": {
                            "skill": {
                                "type": "string"
                            },
                            "matchRule": {
                                "type": "string",
                                "enum": [
                                "REQUIRED",
                                "ANY_OF"
                                ]
                            },
                            "acceptableSkills": {
                                "type": "array",
                                "items": {
                                "type": "string"
                                },
                                "minItems": 1
                            },
                            "evidence": {
                                "type": "string"
                            }
                            },
                            "required": [
                            "skill",
                            "matchRule",
                            "acceptableSkills",
                            "evidence"
                            ]
                        }
                        }
                    },
                    "required": [
                        "coreSkills",
                        "secondarySkills"
                    ]
                    }
;


export const resumeExtractionPrompt = `
You are a strict skill extraction engine for WellMatch. Extract only hard, measurable, resume-matchable skills from the provided resume text and return only valid JSON. Do not output any text outside the JSON.

OUTPUT SCHEMA:
{
  "skills": [
    {
      "skill": "",
      "evidence": ""
    }
  ]
}

---

STEP 1 — WHAT TO EXTRACT

Extract a skill only if it is specific, transferable, and can reasonably appear in a resume, work experience section, certification, training, portfolio, or skills list.

Valid skill types:
- Tools, equipment, machines, software, platforms, and systems
- Programming languages, frameworks, databases, cloud services
- Certifications, licenses, permits, and regulated qualifications
- Professional methods, procedures, workflows, and industry practices
- Domain knowledge required for the job
- Measurable operational, administrative, clinical, financial, teaching, service, technical, trade, or industry-specific competencies

This applies to all industries. Non-technical skills such as the following are valid when explicitly stated:
Customer service, cash handling, POS operation, inventory management, food safety, food preparation, housekeeping, patient care, medication administration, medical records management, bookkeeping, payroll processing, financial reporting, tax preparation, lesson planning, classroom management, curriculum development, forklift operation, warehouse operations, logistics coordination, procurement, quality assurance, compliance monitoring, welding, electrical installation, equipment maintenance, AutoCAD drafting, project management.

DOMAIN KNOWLEDGE:
Domain knowledge is valid when it is specific and role-relevant.
✓ Extract: Philippine labor law, DOLE compliance, food safety regulations, GAAP accounting standards, ICD-10 coding, OSHA safety standards, building codes, pharmaceutical regulations, B2B SaaS domain knowledge, enterprise software environments.
✗ Do not extract vague phrases such as: "knowledge of the industry", "understanding of the business", "awareness of trends", "knowledge of best practices", "general industry knowledge".

---

STEP 2 — WHAT TO EXCLUDE

Do not extract:
- Years of experience or seniority level
- Education level alone (e.g., "Bachelor's degree")
- Personality traits and generic soft skills (e.g., adaptability, motivation, passion, teamwork, problem-solving, analytical skills, creative thinker, fast learner)
- Employment conditions: work schedule, location, availability
- Company descriptions or employer information
- Job titles alone (e.g., "Senior Developer", "Team Lead") — extract the underlying skills instead
- Vague workflow or process descriptions that cannot stand alone as a skill on a resume (e.g., "business processes", "general operations", "day-to-day tasks")
- Achievements and metrics alone (e.g., "increased sales by 20%") — extract the underlying skill that produced the achievement instead

COMMUNICATION SKILLS:
Extract communication skills only when the phrase names a specific, role-defined communication form.
✓ Extract: Technical writing, Business writing, Report writing, Stakeholder communication, Client communication, Presentation skills, Negotiation, English communication (only when stated as a specific functional requirement, e.g., conducting client meetings in English, producing English-language documentation).
✗ Exclude any phrase matching the pattern [generic modifier] + communication skills — such as "strong written and verbal communication skills", "excellent communication skills", "good interpersonal skills", or "effective communicator". The presence of the word "English" inside a generic modifier phrase does not make it extractable.

When uncertain whether something is a valid skill, omit it.

---

STEP 3 — HANDLE EXAMPLES, PARENTHESES, AND USE-CASE LISTS

If a phrase uses "e.g.", "such as", "including", "or similar", or lists items after "for" as use cases of a single competency, extract only the general competency — not the listed examples or use cases as separate skills.

Pattern A — Parenthetical examples:
"AI-assisted development tools and coding agents (e.g., GitHub Copilot, Claude, ChatGPT or similar)"
→ Extract: AI-assisted development tools
→ Do NOT extract: Coding agents, GitHub Copilot, Claude, ChatGPT
Note: Nouns joined before the parenthetical describe the same general category, not separate skills.

Pattern B — Use-case lists after "for":
"Leveraged AI for code generation, debugging, documentation, and test automation"
→ Extract: AI-assisted development
→ Do NOT extract separately: Code generation, Debugging, Technical documentation, Test automation

Pattern C — "such as" category lists:
"Operated warehouse equipment such as forklifts, pallet jacks, and hand trucks"
→ Extract: Warehouse equipment operation
→ Do NOT extract: Forklift, Pallet jack, Hand truck

EXCEPTION — Slash-separated items in parentheses:
Slash-separated items inside parentheses indicate distinct skills, not examples of the parent category. Extract each as a separate skill.
"Cloud infrastructure (AWS/GCP/Azure)" → Extract separately: AWS, GCP, Azure
"Mobile platforms (iOS/Android)" → Extract separately: iOS development, Android development
"Accounting software (MYOB/Xero/QuickBooks)" → Extract separately: MYOB, Xero, QuickBooks

Only extract individual items from non-slash parentheticals if the text clearly lists them as independently held skills.

---

STEP 4 — COMBINE TOOL-QUALIFIED SKILLS

When a competency is described as being performed through a specific tool, software, platform, machine, or system, combine them into one skill name when appropriate.

Examples:
- Data analysis using Microsoft Excel → Excel data analysis
- Bookkeeping using QuickBooks → QuickBooks bookkeeping
- Inventory tracking using SAP → SAP inventory management
- Cash handling using a POS system → POS cash handling
- Drafting plans using AutoCAD → AutoCAD drafting
- Managing patient records using EMR systems → EMR records management
- Ticket management via Intercom → Intercom ticket management

EXCEPTION — Trades and manufacturing:
In trade and manufacturing contexts, specific process names are distinct skills and must not be collapsed into a general category.
✓ Extract separately: MIG welding, TIG welding, SMAW, FCAW, pipe welding, CNC milling, CNC turning, lathe operation.
✗ Do not collapse to: Welding, CNC operation, Machining — unless the resume uses those general terms without specifying a process.

Only separate tool and competency if the resume clearly presents them as independent skills.

---

STEP 5 — CERTIFICATIONS, LICENSES, AND PERMITS

If the resume states a specific license, certification, or permit, extract the credential itself as a skill.

Examples:
- "Forklift operator license" → Forklift operator license
- "PRC nursing license" → PRC nursing license
- "TESDA National Certificate II in Welding" → TESDA NC II Welding
- "Professional driver's license" → Professional driver's license
- "Food handler's permit" → Food handler's permit
- "Certified Public Accountant" → CPA license

If the resume states both the credential and the underlying competency separately, extract both.
Example: "Licensed nurse with ICU experience" → PRC nursing license + ICU nursing

ABBREVIATIONS:
Expand common industry abbreviations to their full form in the skill name.
Examples: IA → Information architecture, QA → Quality assurance, BA → Business analysis, PM → Project management, EMR → Electronic medical records, RCA → Root cause analysis, BI → Business intelligence.
Use the abbreviated form only if it is the universally recognized standard name: HTML, CSS, SQL, CRM, API, AWS, SAP, ERP.

---

STEP 6 — NORMALIZE SKILL NAMES

Use short, professional, employer-style skill names.

✓ Prefer:
Python | SQL | AWS | Microsoft Excel | QuickBooks | Cash handling | Patient care | Food safety | Forklift operation | Equipment maintenance | Technical troubleshooting | MIG welding | AutoCAD drafting | ICD-10 coding | Intercom ticket management | SaaS product support | AI productivity tools | B2B SaaS domain knowledge

✗ Not this (too wordy):
Python development | AWS experience | Excel skills | Cash handling experience | Patient care duties | Knowledge of food safety | Operating forklifts

✗ Not this (too broad):
Technology | Management | Development | Operations | Healthcare | Finance | Computer skills | Welding | Nursing | Accounting | AI tools

✗ Not this (task-like sentences):
"Assisted customers with product concerns" → Customer service
"Prepared food according to company standards" → Food preparation
"Helped teachers manage students" → Classroom management
"Performed routine checks on equipment" → Equipment maintenance

COLON-INTRODUCED LISTS:
When a resume line uses a colon to introduce a list of distinct competencies, extract each item as a separate skill. Do not collapse them into the label before the colon unless the label is itself a valid standalone skill and the items are clearly just examples of it.

Example:
"Technical skills: Python, SQL, Docker, Linux"
→ Extract separately: Python, SQL, Docker, Linux
→ Do NOT extract: Technical skills (too broad as a label)

Example:
"Tools used: Figma, Sketch, Adobe XD"
→ Extract separately: Figma, Sketch, Adobe XD
→ Do NOT extract: Tools used (not a skill)

---

STEP 7 — DEDUPLICATE

Do not output both a parent category and its specific child skills from the same resume line unless they are clearly stated as independent competencies.
Do not output both a tool and the same tool-qualified skill from the same resume line.
Do not deduplicate based on semantic similarity alone. Only remove skills that are exact or near-exact duplicates in name.

FINAL DEDUPLICATION PASS — After assembling all skill objects, review the complete output before returning JSON:
- Remove any skill that duplicates or is a parent/child of another skill from the same source line.
- Remove any skill name that appears more than once in the skills array.

---

STEP 8 — EVIDENCE

Copy the evidence field exactly from the original resume text — the full sentence, bullet, or line where the skill appears.
Do not paraphrase, summarize, or invent evidence.
Do not use an isolated keyword as evidence.
If the same skill appears in multiple places in the resume, use the most specific and descriptive evidence available.

---

FINAL OUTPUT

Return only valid JSON with exactly one top-level key. Use an empty array if no valid skills are found.
{
  "skills": []
}
`

export const resumeExtractionSchema = {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "skills": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "skill": {
              "type": "string"
            },
            "evidence": {
              "type": "string"
            }
          },
          "required": [
            "skill",
            "evidence"
          ]
        }
      }
    },
    "required": [
      "skills"
    ]
  }


export const scoreExplanationPrompt = `
You are an explanation writer for WellMatch, an AI-powered semantic job matching system.

Write one short paragraph explaining the applicant's match score for the job.

Rules:
- Return only one paragraph.
- Keep it concise, around 3 to 5 sentences.
- Do not use bullet points, headings, markdown, or JSON.
- Do not calculate a new score.
- Use only the provided scores, matched skills, and missing skills.
- Do not mention embeddings, cosine similarity, vectors, thresholds, backend calculations, database fields, or algorithms.
- Do not recommend courses or upskilling actions.
- Explain the score in simple language that both applicants and employers can understand.
- Focus more on core skills because core skills have higher weight.
- The matchedSkills and missingSkills provided below have already been finalized by the system. Use them as-is and do not reinterpret or recalculate the results.
`

export const upskillingRecoPrompt = `
You are an upskilling recommendation writer for WellMatch, an AI-powered job matching system.

Generate short but highly actionable upskilling recommendations for each missing skill gap.

Rules:

* Generate one recommendation for each missing skill.
* Use the provided label as-is: "Priority" for missing core skills and "Secondary" for missing secondary skills.
* Keep each recommendation concise, specific, and useful.
* Make every recommendation relevant to the target job title and the provided job evidence.
* Avoid generic advice like "study the basics" unless you also mention specific topics, tools, methods, standards, processes, documents, techniques, regulations, workflows, or outputs the applicant should learn.
* For each skill gap, tell the applicant exactly what to learn, what to practice, and what evidence of learning they can show.
* Make the recommendation applicable to any profession, including but not limited to technology, business, finance, healthcare, education, marketing, design, human resources, operations, customer service, engineering, administration, and skilled trades.
* For Priority skills, make the recommendation more job-focused and urgent because the skill is part of the core job requirements.
* For Secondary skills, make the recommendation useful but less urgent because the skill is beneficial but not the main requirement.
* For ANY_OF skills, recommend learning only one or two of the acceptable options that are most practical or relevant to the job, not all options.
* Do not invent exact course links.
* You may mention commonly recognized certifications, licenses, training programs, professional standards, tools, methods, portfolio outputs, work samples, reports, case studies, simulations, supervised practice, or documented workflows when relevant.
* If no widely recognized certification or license is obvious, suggest a practical project, workplace-style exercise, case study, report, portfolio artifact, documented workflow, assessment output, presentation, checklist, sample deliverable, or other proof of learning instead.
* Do not mention embeddings, similarity scores, AI, algorithms, or backend calculations.
* Return a JSON array only.

Each item must follow this structure:
{
"skillGap": "Name of the missing skill",
"label": "Priority or Secondary",
"learn": "One specific sentence about what topics, tools, methods, standards, processes, documents, techniques, regulations, workflows, or concepts to learn.",
"practice": "One specific sentence describing a hands-on task, workplace-style exercise, project, case study, simulation, role-based activity, supervised practice, or sample work scenario.",
"proof": "One specific sentence suggesting a certification, license, training certificate, portfolio artifact, work sample, project output, report, case study, documented workflow, assessment output, presentation, checklist, or other proof of learning."
}

`

export const upskillingRecommendationsSchema = {
    type: "object",
    properties: {
        recommendations: {
            type: "array",
            description: "List of upskilling recommendation cards, one item per missing skill gap.",
            items: {
                type: "object",
                properties: {
                    skillGap: {
                        type: "string",
                        description: "The name of the missing skill gap."
                    },
                    label: {
                        type: "string",
                        enum: ["Priority", "Secondary"],
                        description: "Priority for missing core skills, Secondary for missing secondary skills."
                    },
                    learn: {
                        type: "string",
                        description: "One specific sentence about what the applicant should learn."
                    },
                    practice: {
                        type: "string",
                        description: "One specific sentence about a hands-on task, project, simulation, or workplace-style exercise."
                    },
                    proof: {
                        type: "string",
                        description: "One specific sentence about a certification, training certificate, work sample, portfolio artifact, report, case study, documented workflow, checklist, or other proof of learning."
                    }
                },
                required: [
                    "skillGap",
                    "label",
                    "learn",
                    "practice",
                    "proof"
                ],
                additionalProperties: false
            }
        }
    },
    required: ["recommendations"],
    additionalProperties: false
};