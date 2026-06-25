export default function parseEmbedding(embedding) {
    if (!embedding) {
        return [];
    }

    if (Array.isArray(embedding)) {
        return embedding;
    }

    try {
        return JSON.parse(embedding);
    } catch (error) {
        console.error("Failed to parse embedding:", error);
        return [];
    }
}