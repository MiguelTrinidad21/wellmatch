export default function validPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;

    if (!passwordRegex.test(password)) {
        return {
            valid: false,
            issue: "invalidPass",
            message: "Password must be 12+ characters with uppercase, lowercase, and special characters."
        }
    }

    return {valid: true};
}