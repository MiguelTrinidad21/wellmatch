import streamifier from "streamifier";
import path from "path"
import cloudinary from "../configs/cloudinary.js";

export function uploadToCloudinary(fileBuffer, folder) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}

export function uploadResume(fileBuffer, folder, originalName) {
    return new Promise((resolve, reject) => {
        const extension = path.extname(originalName); // .pdf or .docx
        const baseName = path.basename(originalName, extension);

        const safeBaseName = baseName
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");

        const publicId = `${safeBaseName}_${Date.now()}${extension.toLowerCase()}`;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "raw",
                public_id: publicId,
                filename_override: originalName
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}