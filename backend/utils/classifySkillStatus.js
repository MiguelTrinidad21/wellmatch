export default function classifySkillStatus(skillScore, evidenceScore) {
    const skillThreshold = 0.57;
    const evidenceThreshold = 0.51;

    if (skillScore >= skillThreshold && evidenceScore >= evidenceThreshold) {
        return "matched";
    }

    if (skillScore >= 0.65 && evidenceScore >= 0.42) {
        return "matched";
    }

    return "missing";
}