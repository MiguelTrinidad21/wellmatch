
export default function formatDate(date) {
    const dateFormat = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: "numeric",
        minute: "2-digit"
    };

    return new Date(date).toLocaleDateString('en-US', dateFormat);

}