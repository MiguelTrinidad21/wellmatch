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

Place extracted skills in secondarySkills if:
- The sentence came from preferred_qualifications, OR
- The sentence contains any optional signal word, regardless of source field.

Optional signal words: preferred, highly regarded, would be regarded, will be regarded, regarded, desirable, nice to have, bonus, a plus, advantage, familiarity with, exposure to, beneficial, preferred experience.

Otherwise, place extracted skills from required_qualifications in coreSkills.

Classification is determined strictly by (1) the source field and (2) the presence of optional signal words in that specific sentence. Do not infer classification from topic, domain, or perceived importance of the skill.

MID-SENTENCE SIGNAL WORDS:
If an optional signal phrase governs only part of a sentence, split the sentence at the signal phrase boundary and apply the signal only to the skills it governs. Skills in the non-signal portion follow the source field classification rule.

Example:
"Strong Python knowledge and familiarity with GitHub and engineering workflows"
→ "Strong Python knowledge" has no signal → Python goes to coreSkills
→ "familiarity with GitHub and engineering workflows" contains "familiarity with" → GitHub goes to secondarySkills
→ "Engineering workflows" is too vague to extract — omit

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
