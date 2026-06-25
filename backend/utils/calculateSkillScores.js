
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

    const coreSkillScore = Math.trunc((totalMatchedCoreSkills/totalCoreSkills) * 100);
    const secondarySkillScore = Math.trunc((totalMatchedSecondarySkills/totalSecondarySkills) * 100);
    const overAllScore = (((totalMatchedCoreSkills * 0.8) + (totalMatchedSecondarySkills * 0.2)) / ((totalCoreSkills * 0.8) + (totalSecondarySkills * 0.2))) * 100;
    
    let interpretation;

    if (overAllScore >= 80) interpretation = "Excellent Match"
    else if (79 >= overAllScore >= 60) interpretation = "Good Match"
    else interpretation = "Low Match"

    return {
        totalCoreSkills,
        totalMatchedCoreSkills,
        totalSecondarySkills,
        totalMatchedSecondarySkills,
        coreSkillScore,
        secondarySkillScore,
        overAllScore,
        interpretation
    }
}