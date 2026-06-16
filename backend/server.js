import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import geoapifyRoutes from './routes/geoapifyRoutes.js'
import employerRoutes from './routes/employerRoutes.js'
import applicantRoutes from './routes/applicantRoutes.js'
import { verifyToken } from './middlewares/authorizeUser.js';
dotenv.config();

const app = express();
const serverPort = process.env.SERVER_PORT;


app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/geoapify', geoapifyRoutes);
app.use('/api/employer', employerRoutes)
app.use('/api/applicant', applicantRoutes)

app.use("/api/auth/me", verifyToken, (req, res) => {
    return res.status(200).json({
        user: req.user
    });
})

app.listen(serverPort, () => {
    console.log(`Listening to port ${serverPort}`);
})