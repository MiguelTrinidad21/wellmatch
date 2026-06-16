import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error("Only pdf or docx files are allowed");
            error.issue = "fileType";
            error.field = file.fieldname; 
            return cb(error);
        }

        cb(null, true);
    }
});

const uploadApplicantResume = upload.single("resume");

export default function handleMulterResumeUpload(req, res, next) {
    uploadApplicantResume(req, res, function (error) {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "Resume must not exceed 5MB",
                    issue: "fileSize",
                    field: "resume"
                });
            }

            return res.status(400).json({
                message: error.message,
                issue: "uploadError",
                field: error.field || "resume"
            });
        }

        if (error) {
            return res.status(400).json({
                message: error.message,
                issue: error.issue || "fileType",
                field: error.field || "resume"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a resume.",
                issue: "noResume",
                field: "resume"
            });
        }

        next();
    });
}