import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp"
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error("Only image files are allowed");
            error.issue = "fileType";
            error.field = file.fieldname; 
            return cb(error);
        }

        cb(null, true);
    }
});

const uploadApplicantPhoto = upload.single("profilePhoto");

export default function handleApplicantPhotoUpload(req, res, next) {
    uploadApplicantPhoto(req, res, function (error) {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "Photo must not exceed 5MB",
                    issue: "fileSize",
                    field: "photo"
                });
            }

            return res.status(400).json({
                message: error.message,
                issue: "uploadError",
                field: error.field || "photo"
            });
        }

        if (error) {
            return res.status(400).json({
                message: error.message,
                issue: error.issue || "fileType",
                field: error.field || "photo"
            });
        }

        next();
    });
}