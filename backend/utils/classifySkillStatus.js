export default function classifySkillStatus(skillScore, evidenceScore) {
    const skillThreshold = 0.57;
    const evidenceThreshold = 0.52;

    if (skillScore >= skillThreshold && evidenceScore >= evidenceThreshold) {
        return "matched";
    }

    return "missing";
}