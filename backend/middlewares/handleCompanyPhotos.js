import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
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

const uploadCompanyImages = upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 }
]); 

export default function handleMulterUpload(req, res, next) {
    uploadCompanyImages(req, res, function (error) {
        if (error) {
            return res.status(400).json({
                message: error.message,
                issue: error.issue || "fileType",
                field: error.field || "photos"
            });
        }

        // 🚀 MANUAL SIZE CHECKING (Now that files are fully uploaded and size exists!)
        const profilePhoto = req.files?.profilePhoto?.[0];
        const coverPhoto = req.files?.coverPhoto?.[0];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (profilePhoto && profilePhoto.size > maxSize) {
            return res.status(400).json({
                message: "Profile photo must not exceed 5MB",
                issue: "fileSize",
                field: "profilePhoto" // 👈 Pinpoints the profile photo!
            });
        }

        if (coverPhoto && coverPhoto.size > maxSize) {
            return res.status(400).json({
                message: "Cover photo must not exceed 5MB",
                issue: "fileSize",
                field: "coverPhoto" // 👈 Pinpoints the cover photo!
            });
        }

        next();
    });
}