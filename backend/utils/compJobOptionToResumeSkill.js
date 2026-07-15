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

    const cleanedResumeSkill = resumeSkill.skillName.trim().toLowerCase()
    const cleanedResumeEvidence = resumeSkill.evidence.trim().toLowerCase()

    return {
        resumeSkillName: resumeSkill.skillName,
        resumeEvidence: resumeSkill.evidence,
        skillSimilarity,
        evidenceSimilarity: cleanedResumeSkill === cleanedResumeEvidence ? 0.52 : evidenceSimilarity
    };
}