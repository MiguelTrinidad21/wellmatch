const EMAIL       = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PROFILE_URL = /(https?:\/\/)?(www\.)?(linkedin\.com|facebook\.com|fb\.com|instagram\.com|twitter\.com|x\.com)\/\S*/gi;
const PH_MOBILE   = /(\+?63[\s-]?|\b0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g;       
const INTL_PHONE  = /\+\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}\b/g;   
const PH_LANDLINE = /\(0\d{1,2}\)[\s-]?\d{3,4}[\s-]?\d{4}\b/g;                 


const NAME_PARTICLES = new Set(["dela", "del", "los", "las", "san", "sta", "santa", "van", "von"]);

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function redactContactInfo(text, { firstName, lastName } = {}) {
    if (!text) return "";

    let redacted = text
        .replace(EMAIL, "[EMAIL]")
        .replace(PROFILE_URL, "[PROFILE LINK]")
        .replace(PH_MOBILE, "[PHONE]")
        .replace(INTL_PHONE, "[PHONE]")
        .replace(PH_LANDLINE, "[PHONE]");

    const nameParts = `${firstName ?? ""} ${lastName ?? ""}`
        .split(/\s+/)
        .filter(part => part.length >= 3 && !NAME_PARTICLES.has(part.toLowerCase()));

    for (const part of nameParts) {
        const pattern = new RegExp(`(?<!\\p{L})${escapeRegex(part)}(?!\\p{L})`, "giu");
        redacted = redacted.replace(pattern, "[NAME]");
    }

    return redacted;
}