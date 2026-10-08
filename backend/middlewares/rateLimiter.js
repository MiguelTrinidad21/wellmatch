import rateLimit, { ipKeyGenerator } from "express-rate-limit";


export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,                          
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: "Too many attempts. Please try again in 15 minutes." }
});


export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,                          
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: "Too many attempts. Please try again in 15 minutes." }
});


export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,                          
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: "Too many attempts. Please try again after an hour." }
});


export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,               // 1 hour
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id
        ? `user-${req.user.id}`
        : ipKeyGenerator(req.ip),
    message: { message: "You've reached the hourly limit. Please try again later." }
});


