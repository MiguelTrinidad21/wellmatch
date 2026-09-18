import validator from "validator";

export default function validateEmail(email) {
    return validator.isEmail(email);
}