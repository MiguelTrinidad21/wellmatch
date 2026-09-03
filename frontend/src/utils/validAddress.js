
export default function validAddress(address) {

    const addressREGEX = /^[A-Za-zÀ-ÿ.]+(?: [A-Za-zÀ-ÿ.]+)*, [A-Za-zÀ-ÿ.]+(?: [A-Za-zÀ-ÿ.]+)*$/;

    const minLength = 5; 
    const maxLength = 60;


    if (!address || typeof address !== "string") {
        return { 
            valid: false,
            issue: "invalidAddress", 
            reason: "Address is required." 
        };
    }

    const trimmed = address.trim();

    if (trimmed.length < minLength || trimmed.length > maxLength) {
        return { 
            valid: false,
            issue: "invalidAddress", 
            reason: `Address must be between ${minLength} and ${maxLength} characters.` 
        };
    }

    if (!addressREGEX.test(trimmed)) {
        return { 
            valid: false,
            issue: "invalidAddress", 
            reason: 'Address must follow the format "Municipality, Province" (e.g., Angeles, Pampanga).' 
        };
    }

    return { valid: true };
}