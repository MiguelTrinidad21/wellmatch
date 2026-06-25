import { cosineSimilarity } from "./cosineSimilarity.js";

export default function compareJobOptionToResumeSkill(jobOption, resumeSkill) {
    const skillSimilarity = cosineSimilarity(
        jobOption.skillEmbedding,
        resumeSkill.skillEmbedding
    );

    const evidenceSimilarity = cosineSimilarity(
        jobOption.evidenceEmbedding,
        resumeSkill.evidenceEmbedding
    );

    return {
        resumeSkillName: resumeSkill.skillName,
        resumeEvidence: resumeSkill.evidence,
        skillSimilarity,
        evidenceSimilarity
    };
}