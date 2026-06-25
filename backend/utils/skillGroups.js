import parseEmbedding from "./parseEmbedding.js"

export function buildJobSkillGroups(jobSkillRows) {
    const groupedSkills = new Map();

    for (const row of jobSkillRows) {
        let groupKey;

        if (row.matchRule === "ANY_OF") {
            groupKey = `${row.skillType}-${row.parentSkill}-${row.matchRule}`;
        } else {
            groupKey = `${row.skillType}-${row.parentSkill}-${row.acceptableSkill}-${row.jobSkillEmbeddingID}`;
        }

        if (!groupedSkills.has(groupKey)) {
            groupedSkills.set(groupKey, {
                skillType: row.skillType,
                parentSkill: row.parentSkill,
                matchRule: row.matchRule,
                options: []
            });
        }

        groupedSkills.get(groupKey).options.push({
            acceptableSkill: row.acceptableSkill,
            evidence: row.evidence,
            skillEmbedding: parseEmbedding(row.skillEmbedding),
            evidenceEmbedding: parseEmbedding(row.evidenceEmbedding)
        });
    }

    return Array.from(groupedSkills.values());
}

export function buildResumeSkillGroups(resumeSkills) {
    const resumeSkillGroup = resumeSkills?.map((row) => {
        return ({
            resumeSkillEmbeddingID: row.resumeSkillEmbeddingID,
            skillName: row.skillName,
            evidence: row.evidence,
            skillEmbedding: parseEmbedding(row.skillEmbedding),
            evidenceEmbedding: parseEmbedding(row.evidenceEmbedding)
        })
    })

    return resumeSkillGroup;
}