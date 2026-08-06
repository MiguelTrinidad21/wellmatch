import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import database from './configs/database.js';
import geoapifyRoutes from './routes/geoapifyRoutes.js'
import employerRoutes from './routes/employerRoutes.js'
import applicantRoutes from './routes/applicantRoutes.js'
import { verifyToken } from './middlewares/authorizeUser.js';
dotenv.config();

const app = express();
app.set('trust proxy', 1);

const serverPort = process.env.PORT || process.env.SERVER_PORT || 5000;

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — Origin: ${req.headers.origin}`);
    next();
});

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/geoapify', geoapifyRoutes);
app.use('/api/employer', employerRoutes)
app.use('/api/applicant', applicantRoutes)

app.use("/api/auth/me", verifyToken, async (req, res) => {
    try {
        if (req.user.userType === "applicant") {
            const [result] = await database.query(`
                SELECT applicantID AS id, email, firstName, lastName, address, profilePhotoURL AS profilePhoto
                FROM applicants
                WHERE applicantID = ?
                LIMIT 1`, [req.user.id]);

            const applicant = result[0];

            if (!applicant) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.status(200).json({
                user: { userType: "applicant", ...applicant }
            });
        }

        if (req.user.userType === "employer" || req.user.userType === "admin") {
            const [result] = await database.query(`
                SELECT 
                    e.employerID AS id,
                    e.email,
                    e.firstName,
                    e.lastName,
                    cm.compMemID,
                    cm.companyID,
                    cm.role,
                    c.companyName,
                    c.profilePhotoURL AS companyPhoto
                FROM employers e
                INNER JOIN companyMembers cm ON e.employerID = cm.employerID
                INNER JOIN companies c ON cm.companyID = c.companyID
                WHERE e.employerID = ?
                    AND cm.companyID = ?
                    AND cm.status = 'active'
                LIMIT 1`,
                [req.user.id, req.user.companyID]
            );

            const employer = result[0];
            if (!employer) {
                return res.status(404).json({ message: "Employer account not found" });
            }

            return res.status(200).json({
                user: { userType: req.user.userType, ...employer }
            });
        }

        return res.status(400).json({ message: "Unsupported user type" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to connect to the server. Please try again." });
    }
})

app.listen(serverPort, () => {
    console.log(`Listening to port ${serverPort}`);
})