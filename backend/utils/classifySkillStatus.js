export default function classifySkillStatus(skillScore, evidenceScore) {

    const skillThreshold = 0.56;
    const evidenceThreshold = 0.61;

    
    if (skillScore >= skillThreshold || evidenceScore >= evidenceThreshold) {
        return "matched";
    }

    return "missing";
}