
export function getMatchedSkills(skillGapResult) {
    const matchedSkills = [];

    for (const item of skillGapResult) {
            if (item.status === "matched") {
                matchedSkills.push(item)
            }
    }

    return matchedSkills;
}

export function getSkillGaps(skillGapResult) {
    const skillGaps = [];

    for (const item of skillGapResult) {
            if (item.status === "missing") {
                skillGaps.push(item)
            }
    }

    return skillGaps;
}