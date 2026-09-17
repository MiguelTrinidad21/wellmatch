
export default function calculateSkillScores(matchedSkills, skillGapResult) {
    let totalCoreSkills = 0;
    let totalSecondarySkills = 0;

    let totalMatchedCoreSkills = 0;
    let totalMatchedSecondarySkills = 0;


    for (const item of skillGapResult) {
        if (item.skillType === "core") {
            totalCoreSkills++;
        } else {
            totalSecondarySkills++;
        }
    }

    for (const item of matchedSkills) {
        if (item.skillType === "core") {
            totalMatchedCoreSkills++;
        } else {
            totalMatchedSecondarySkills++
        }
    }

    const coreSkillScore = totalCoreSkills > 0
        ? Math.trunc((totalMatchedCoreSkills / totalCoreSkills) * 100)
        : null;

    const secondarySkillScore = totalSecondarySkills > 0
        ? Math.trunc((totalMatchedSecondarySkills / totalSecondarySkills) * 100)
        : null;

    const REQUIRED_WEIGHT  = 0.8;
    const PREFERRED_WEIGHT = 0.2;

    let overAllScore;

    if (totalCoreSkills > 0 && totalSecondarySkills > 0) {
        overAllScore = Math.trunc(
            (
                REQUIRED_WEIGHT  * (totalMatchedCoreSkills / totalCoreSkills) +
                PREFERRED_WEIGHT * (totalMatchedSecondarySkills / totalSecondarySkills)
            ) * 100
        );
    } else if (totalCoreSkills > 0) {
        overAllScore = coreSkillScore;
    } else if (totalSecondarySkills > 0) {
        overAllScore = secondarySkillScore;
    } else {
        overAllScore = 0;
    }
    
    let interpretation;
    if (overAllScore >= 80) interpretation = "Excellent Match";
    else if (overAllScore >= 60) interpretation = "Good Match";
    else interpretation = "Low Match";

    return {
        totalCoreSkills,
        totalMatchedCoreSkills,
        totalSecondarySkills,
        totalMatchedSecondarySkills,
        coreSkillScore,
        secondarySkillScore,
        overAllScore,
        interpretation
    };
}