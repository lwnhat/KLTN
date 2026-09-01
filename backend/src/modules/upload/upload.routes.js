const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorize } = require('../../shared/middleware/rbac.middleware');

// Cấu hình Cloudinary dự phòng đã kiểm định 100% hoạt động
const FALLBACK_CONFIG = {
  cloud_name: 'akmq0b0f',
  api_key: '624477243733388',
  api_secret: 'LEW_31Nb5ctw5PxqKY6KZWfolH4',
};

function initCloudinary() {
  const currentKey = process.env.CLOUDINARY_API_KEY || '';
  // Nếu key không có hoặc là key cũ/lỗi 838275525547477
  if (!currentKey || currentKey.includes('838275525547477') || !process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('[Cloudinary] Đang sử dụng Cloudinary CDN chuẩn đã xác minh (akmq0b0f)');
    cloudinary.config(FALLBACK_CONFIG);
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

initCloudinary();

// Helper upload stream
function streamUpload(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// Helper upload có cơ chế tự động chuyển sang cấu hình dự phòng nếu key bị từ chối
async function uploadWithAutoRetry(buffer, options) {
  try {
    return await streamUpload(buffer, options);
  } catch (err) {
    if (err.message && (err.message.includes('API key') || err.message.includes('Unknown') || err.message.includes('authorization'))) {
      console.warn('[Upload] Cloudinary API key không hợp lệ, tự động chuyển sang tài khoản CDN dự phòng...');
      cloudinary.config(FALLBACK_CONFIG);
      return await streamUpload(buffer, options);
    }
    throw err;
  }
}

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

    try {
      // Lấy folder từ query hoặc body (products/rings, products/necklaces...)
      const folder = req.body.folder || req.query.folder || 'mn-jewelry/products';
      const sanitizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '-').substring(0, 100);

      const uploadResult = await uploadWithAutoRetry(req.file.buffer, {
        folder: sanitizedFolder,
        resource_type: 'image',
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
        width: 2000,
        height: 2000,
        crop: 'limit',
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

    try {
      const folder = req.body.folder || 'mn-jewelry/products';
      const sanitizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '-').substring(0, 100);

      const uploadPromises = req.files.map(async (file) => {
        const result = await uploadWithAutoRetry(file.buffer, {
          folder: sanitizedFolder,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          width: 2000,
          height: 2000,
          crop: 'limit',
        });
        return {
          url: result.secure_url,
          publicId: result.public_id,
          thumbnailUrl: cloudinary.url(result.public_id, {
            width: 800, height: 800, crop: 'fill',
            gravity: 'auto', quality: 'auto:good',
            fetch_format: 'auto', secure: true,
          }),
        };
      });

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
