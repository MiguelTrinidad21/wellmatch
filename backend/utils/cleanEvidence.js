export default function cleanEvidence(text) {
  if (!text) return text;
  return text
    // strip leading bullet/list markers (with optional whitespace after)
    .replace(/^[\s]*[•\-\*\‣\●\▪\◦\→]+\s*/, '')
    // strip leading numbered/lettered list markers like "1." "a)" "i."
    .replace(/^[\s]*(\d+[\.\)]|\(?[a-zA-Z][\.\)])\s*/, '')
    // collapse any leftover double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}