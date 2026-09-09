import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isCloudinaryEnabled, uploadToCloudinary } from '../config/cloudinary.js';

// Ensure the local uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage Engine (local disk storage used as final storage in dev, or temp storage in prod before Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: prefix + timestamp + random suffix + extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Configure File Filters (Images only)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and WEBP image uploads are allowed!'), false);
  }
};

// Base Multer instance
const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB File Size Limit
  },
});

/**
 * If Cloudinary is enabled (e.g. in production or USE_CLOUDINARY=true),
 * directly upload the file(s) to Cloudinary, update file.path to the Cloudinary URL,
 * and remove the local temporary file.
 */
const processCloudinaryUpload = async (req) => {
  if (!isCloudinaryEnabled()) {
    return;
  }

  const filesToUpload = [];

  if (req.file) {
    filesToUpload.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToUpload.push(...req.files);
    } else if (typeof req.files === 'object') {
      Object.values(req.files).forEach((item) => {
        if (Array.isArray(item)) {
          filesToUpload.push(...item);
        } else if (item) {
          filesToUpload.push(item);
        }
      });
    }
  }

  for (const file of filesToUpload) {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        const result = await uploadToCloudinary(file.path);

        // Delete the local temporary file
        fs.unlink(file.path, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Failed to delete temp file (${file.path}):`, err.message);
          }
        });

        // Set path to Cloudinary URL so all downstream controllers save the URL directly
        file.originalLocalPath = file.path;
        file.path = result.secure_url;
        file.url = result.secure_url;
        file.secure_url = result.secure_url;
        file.public_id = result.public_id;
      } catch (uploadError) {
        // Clean up temp file on failure
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            // ignore
          }
        }
        throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
      }
    }
  }
};

/**
 * Wrapper to run multer handler and process Cloudinary upload seamlessly
 */
const wrapMulterMiddleware = (multerHandler) => {
  return (req, res, next) => {
    multerHandler(req, res, async (err) => {
      if (err) {
        return next(err);
      }
      try {
        await processCloudinaryUpload(req);
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
};

const upload = {
  single: (fieldName) => wrapMulterMiddleware(multerInstance.single(fieldName)),
  array: (fieldName, maxCount) => wrapMulterMiddleware(multerInstance.array(fieldName, maxCount)),
  fields: (fields) => wrapMulterMiddleware(multerInstance.fields(fields)),
  any: () => wrapMulterMiddleware(multerInstance.any()),
  none: () => multerInstance.none(),
};

export default upload;
