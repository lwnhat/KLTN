const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');

// Cấu hình Cloudinary từ environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage — file lưu trong RAM rồi push lên Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh: JPG, PNG, WebP, AVIF'), false);
    }
  },
});

/**
 * POST /api/v1/upload/image
 * Upload 1 ảnh lên Cloudinary từ Admin panel
 * Body: multipart/form-data, field "image"
 * Headers: Authorization: Bearer <admin_token>
 */
router.post(
  '/image',
  authenticate,
  authorize('admin', 'staff'),
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'Không tìm thấy file ảnh' } });
    }

    // Kiểm tra Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào file .env'
        }
      });
    }

    try {
      // Lấy folder từ query hoặc body (products/rings, products/necklaces...)
      const folder = req.body.folder || req.query.folder || 'mn-jewelry/products';
      const sanitizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '-').substring(0, 100);

      // Upload buffer lên Cloudinary bằng upload_stream
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: sanitizedFolder,
            resource_type: 'image',
            transformation: [
              {
                quality: 'auto:good', // Tự động nén tối ưu
                fetch_format: 'auto', // Tự chuyển WebP/AVIF tuỳ browser
              },
            ],
            // Giữ aspect ratio gốc, max 2000px
            width: 2000,
            height: 2000,
            crop: 'limit',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      return res.json({
        success: true,
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          // URL tự động convert sang WebP + resize 800px (dùng cho product card)
          thumbnailUrl: cloudinary.url(uploadResult.public_id, {
            width: 800,
            height: 800,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto:good',
            fetch_format: 'auto',
            secure: true,
          }),
        },
      });
    } catch (err) {
      console.error('[Upload] Cloudinary error:', err);
      return res.status(500).json({
        success: false,
        error: { message: err.message || 'Lỗi khi upload ảnh lên Cloudinary' }
      });
    }
  }
);

/**
 * POST /api/v1/upload/images
 * Upload nhiều ảnh cùng lúc (tối đa 8)
 */
router.post(
  '/images',
  authenticate,
  authorize('admin', 'staff'),
  upload.array('images', 8),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Không tìm thấy file ảnh' } });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      return res.status(503).json({
        success: false,
        error: { message: 'Cloudinary chưa được cấu hình. Vui lòng thêm credentials vào .env' }
      });
    }

    try {
      const folder = req.body.folder || 'mn-jewelry/products';
      const sanitizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '-').substring(0, 100);

      const uploadPromises = req.files.map((file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: sanitizedFolder,
              resource_type: 'image',
              quality: 'auto:good',
              fetch_format: 'auto',
              width: 2000,
              height: 2000,
              crop: 'limit',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({
                url: result.secure_url,
                publicId: result.public_id,
                thumbnailUrl: cloudinary.url(result.public_id, {
                  width: 800, height: 800, crop: 'fill',
                  gravity: 'auto', quality: 'auto:good',
                  fetch_format: 'auto', secure: true,
                }),
              });
            }
          );
          stream.end(file.buffer);
        })
      );

      const results = await Promise.all(uploadPromises);
      return res.json({ success: true, data: results });
    } catch (err) {
      console.error('[Upload] Cloudinary batch error:', err);
      return res.status(500).json({
        success: false,
        error: { message: err.message || 'Lỗi khi upload ảnh' }
      });
    }
  }
);

/**
 * DELETE /api/v1/upload/image
 * Xóa ảnh khỏi Cloudinary (optional - dùng khi xóa variant)
 * Body: { publicId: "mn-jewelry/products/abc123" }
 */
router.delete(
  '/image',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, error: { message: 'Thiếu publicId' } });
    }
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return res.json({ success: true, data: { result } });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
);

module.exports = router;
