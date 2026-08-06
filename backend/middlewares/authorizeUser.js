import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// export function verifyToken(req, res, next) {
//     const token = req.cookies?.token;

//     if (!token) {
//         return res.status(401).json({ message: "Access denied. No token provided." });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//         if (err) {
//             const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
//             return res.status(401).json({ message });
//         }
//         req.user = decoded;
//         next();
//     });
// }

export function verifyToken(req, res, next) {
    const token = req.cookies?.token;

    console.log("verifyToken — cookies received:", req.cookies);
    console.log("verifyToken — token present:", !!token);

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("verifyToken — JWT verify failed:", err.name, err.message);
            const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
            return res.status(401).json({ message });
        }
        console.log("verifyToken — success, userType:", decoded.userType);
        req.user = decoded;
        next();
    });
}

export function isEmployer(req, res, next) {
    if (!["Admin Employer", "Employer"].includes(req.user.role)) {
        return res.status(403).json({message: "Forbidden Access"});
    }

    next();
}

export function isAdmin(req, res, next) {
    if (!["Admin Employer"].includes(req.user.role)) {
        return res.status(403).json({message: "Forbidden Access"});
    }

    next();
}

export function isApplicant(req, res, next) {
    if (!["applicant"].includes(req.user.userType)) {
        return res.status(403).json({message: "Forbidden Access"});
    }

    next();
}