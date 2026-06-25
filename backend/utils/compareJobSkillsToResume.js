import findBestResumeMatch from "./findBestResumeMatch.js";
import classifySkillStatus from "./classifySkillStatus.js";

export function compareJobSkillsToResume(jobSkillGroups, resumeSkills) {
    const results = [];

    for (const group of jobSkillGroups) {
        const optionMatches = group.options.map((option) => {
            return findBestResumeMatch(option, resumeSkills);
        });

        const bestOptionMatch = optionMatches.reduce((best, current) => {
            return current.skillSimilarity > best.skillSimilarity ? current : best;
        }, optionMatches[0]);

        const status = classifySkillStatus(bestOptionMatch.skillSimilarity, bestOptionMatch.evidenceSimilarity);

        results.push({
            skillType: group.skillType,
            parentSkill: group.parentSkill,
            matchRule: group.matchRule,

            requiredOptions: group.options.map((option) => option.acceptableSkill),

            matchedJobSkill: bestOptionMatch.acceptableSkill,
            matchedResumeSkill: bestOptionMatch.bestResumeSkill,

            jobEvidence: bestOptionMatch.jobEvidence,
            resumeEvidence: bestOptionMatch.resumeEvidence,

            skillSimilarity: bestOptionMatch.skillSimilarity,
            evidenceSimilarity: bestOptionMatch.evidenceSimilarity,

            status,

            allOptionMatches: optionMatches
        });
    }

    return results;
}