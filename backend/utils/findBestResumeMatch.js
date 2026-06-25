import compareJobOptionToResumeSkill from "./compJobOptionToResumeSkill.js";

export default function findBestResumeMatch(jobOption, resumeSkills) {
    let bestMatch = null;

    for (const resumeSkill of resumeSkills) {
        const currentMatch = compareJobOptionToResumeSkill(
            jobOption,
            resumeSkill
        );

        if (!bestMatch || currentMatch.skillSimilarity > bestMatch.skillSimilarity) {
            bestMatch = currentMatch;
        }
    }

    return {
        acceptableSkill: jobOption.acceptableSkill,
        jobEvidence: jobOption.evidence,
        bestResumeSkill: bestMatch?.resumeSkillName || null,
        resumeEvidence: bestMatch?.resumeEvidence || null,
        skillSimilarity: bestMatch?.skillSimilarity || 0,
        evidenceSimilarity: bestMatch?.evidenceSimilarity || 0
    };
}