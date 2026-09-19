import rateLimit from "express-rate-limit";


export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,                          
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in 15 minutes." }
});


export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,                          
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in 15 minutes." }
});


export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,                          
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again after an hour." }
});





