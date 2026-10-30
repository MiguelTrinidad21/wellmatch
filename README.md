# WellMatch

**An AI-Powered Semantic Job Matching System with Skill Gap Analysis**

WellMatch is a web-based job matching application that uses artificial intelligence and semantic similarity to evaluate how an applicant's skills align with job requirements. It analyzes resumes and job descriptions to identify matching qualifications, highlight skill gaps, and provide AI-assisted upskilling recommendations.

## Features

- **Resume Management** – Upload and manage resumes in PDF and DOCX formats.
- **AI-Powered Skill Extraction** – Extract relevant skills from resumes and job descriptions.
- **Semantic Job Matching** – Identify related skills beyond exact keyword matches using text embeddings and cosine similarity.
- **Job Recommendations** – Discover relevant job opportunities based on applicant qualifications.
- **Skill Gap Analysis** – Identify missing required and preferred qualifications.
- **Upskilling Recommendations** – Generate AI-assisted recommendations for developing missing skills.
- **Job Management** – Create, edit, and manage job postings.
- **Applicant Management** – Review applications and track recruitment progress.
- **Authentication and Authorization** – Secure access through role-based authentication.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Tailwind CSS |
| State Management | Zustand |
| Routing | React Router DOM |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT, bcrypt |
| AI / NLP | OpenAI GPT-5.4-mini, text-embedding-3-large |
| File Storage | Cloudinary |
| Email Service | Brevo |
| Location Services | Geoapify |
| Deployment | Vercel, Railway |

## Getting Started

### Prerequisites

- Node.js 24.x
- npm
- MySQL Server
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd WellMatch
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Configure the backend environment variables by creating a `.env` file:

   ```env
   PORT=
   DB_HOST=
   DB_PORT=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   JWT_SECRET=
   OPENAI_SECRET_KEY=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   BREVO_API_KEY=
   GEOAPIFY_API_KEY=
   FRONTEND_URL=
   ```

4. Start the backend server:

   ```bash
   npm run dev
   ```

5. Open another terminal and install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

6. Configure the frontend environment variables according to the project configuration.

7. Start the frontend development server:

   ```bash
   npm run dev
   ```

The application will be accessible at the local URL provided by Vite.

## Environment Variables

Configure the required environment variables for the database connection, authentication, OpenAI API, Cloudinary, Brevo, and Geoapify.

**Important:** Never commit `.env` files, API keys, database credentials, or other sensitive information to the repository.

## Live Demo

[WellMatch – Live Application](https://wellmatch-ai.vercel.app/)

## Research Proponents

- Alessandro Miguel H. Trinidad
- John Edward A. Aquino
- Natasha Jane C. Ramos
- Xander V. Vinca

**Tarlac State University**  
Bachelor of Science in Information Technology  
Web and Mobile Application Development

## License

This project is developed for academic purposes. All rights reserved by the project contributors unless otherwise specified.
