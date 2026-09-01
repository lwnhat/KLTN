import React, { useState, useCallback } from 'react';
import { Upload, Button, Image, Progress, message, Tag, Tooltip } from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  PictureOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { API_BASE } from '../lib/api';

interface UploadedImage {
  url: string;
  thumbnailUrl?: string;
  publicId?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
  isManual?: boolean; // URL nhập tay
}

interface CloudinaryUploaderProps {
  value?: string[];           // Danh sách URL hiện tại
  onChange?: (urls: string[]) => void;  // Callback khi thay đổi
  folder?: string;            // Folder trên Cloudinary (VD: 'mn-jewelry/rings')
  maxImages?: number;
}

export default function CloudinaryUploader({
  value = [],
  onChange,
  folder = 'mn-jewelry/products',
  maxImages = 8,
}: CloudinaryUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(() =>
    (value || []).filter(Boolean).map((url) => ({ url, isManual: true }))
  );
  const [manualUrl, setManualUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const token = localStorage.getItem('admin_token');

  // Sync internal images → parent onChange
  const syncImages = useCallback(
    (next: UploadedImage[]) => {
      setImages(next);
      const urls = next.filter((img) => img.url && !img.uploading && !img.error).map((img) => img.url);
      onChange?.(urls);
    },
    [onChange]
  );

  const uploadFile = async (file: File, index: number) => {
    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      message.error(`${file.name}: Vượt quá 5MB. Vui lòng nén ảnh trước.`);
      return null;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Upload thất bại (${res.status})`);
      }

      return data.data; // { url, thumbnailUrl, publicId }
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxImages - images.filter((img) => !img.error).length;

    if (remaining <= 0) {
      message.warning(`Đã đạt tối đa ${maxImages} ảnh.`);
      return;
    }

    const toUpload = fileArray.slice(0, remaining);

    // Thêm placeholder loading
    const placeholders: UploadedImage[] = toUpload.map((f) => ({
      url: URL.createObjectURL(f),
      uploading: true,
      progress: 0,
    }));

    const nextImages = [...images, ...placeholders];
    setImages(nextImages);

    // Upload từng file
    const uploadedImages = [...images];
    for (let i = 0; i < toUpload.length; i++) {
      const baseIdx = images.length + i;
      try {
        const result = await uploadFile(toUpload[i], baseIdx);
        uploadedImages.push({
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          publicId: result.publicId,
          uploading: false,
        });
      } catch (err: any) {
        uploadedImages.push({
          url: '',
          uploading: false,
          error: err.message,
        });
        message.error(`Lỗi upload ${toUpload[i].name}: ${err.message}`);
      }

      // Cập nhật sau mỗi file upload xong
      const current = uploadedImages.slice();
      const padded = [
        ...current,
        ...Array(toUpload.length - i - 1).fill({ url: '', uploading: true }),
      ];
      setImages(padded);
    }

    syncImages(uploadedImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    syncImages(next);
  };

  const handleSetPrimary = (idx: number) => {
    const next = [...images];
    const [item] = next.splice(idx, 1);
    syncImages([item, ...next]);
    message.success('Đã đặt làm ảnh đại diện (ảnh đầu tiên)');
  };

  const handleAddManualUrl = () => {
    const url = manualUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) {
      message.error('URL không hợp lệ. Phải bắt đầu bằng http/https.');
      return;
    }
    if (images.length >= maxImages) {
      message.warning(`Đã đạt tối đa ${maxImages} ảnh.`);
      return;
    }
    const next = [...images, { url, isManual: true }];
    syncImages(next);
    setManualUrl('');
  };

  const validImages = images.filter((img) => img.url && !img.error);
  const hasError = images.some((img) => img.error);
  const isMaxed = validImages.length >= maxImages;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Drag & Drop Zone ─────────────────────────────────────── */}
      {!isMaxed && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          style={{
            border: `2px dashed ${isDragging ? '#b45309' : '#d1d5db'}`,
            borderRadius: 12,
            padding: '24px 16px',
            textAlign: 'center',
            background: isDragging ? '#fffbeb' : '#fafafa',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/jpeg,image/png,image/webp,image/avif';
            input.onchange = (e: any) => handleFiles(e.target.files);
            input.click();
          }}
        >
          <CloudUploadOutlined style={{ fontSize: 32, color: isDragging ? '#b45309' : '#94a3b8' }} />
          <div style={{ marginTop: 8, color: isDragging ? '#92400e' : '#64748b', fontSize: 13 }}>
            <strong>Kéo & thả ảnh vào đây</strong> hoặc <strong>click để chọn file</strong>
          </div>
          <div style={{ marginTop: 4, color: '#9ca3af', fontSize: 11 }}>
            JPG, PNG, WebP, AVIF — Tối đa 5MB/ảnh — Upload lên <strong>Cloudinary CDN</strong>
          </div>
          <div style={{ marginTop: 6 }}>
            <Tag color="gold" style={{ fontSize: 11 }}>
              {validImages.length}/{maxImages} ảnh
            </Tag>
            {images.some((img) => img.uploading) && (
              <Tag color="blue" style={{ fontSize: 11 }}>Đang upload...</Tag>
            )}
          </div>
        </div>
      )}

      {/* ── Preview Grid ─────────────────────────────────────────── */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                border: idx === 0 ? '2px solid #b45309' : '1px solid #e5e7eb',
                background: '#f9fafb',
                aspectRatio: '1',
              }}
            >
              {img.uploading ? (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <PictureOutlined style={{ color: '#94a3b8', fontSize: 24 }} />
                  <Progress
                    type="circle"
                    percent={100}
                    size={36}
                    status="active"
                    showInfo={false}
                  />
                  <span style={{ fontSize: 10, color: '#64748b' }}>Đang upload...</span>
                </div>
              ) : img.error ? (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: '#fff1f2',
                }}>
                  <WarningOutlined style={{ color: '#ef4444', fontSize: 20 }} />
                  <span style={{ fontSize: 10, color: '#ef4444', padding: '0 4px', textAlign: 'center' }}>Lỗi upload</span>
                </div>
              ) : (
                <Image
                  src={img.thumbnailUrl || img.url}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  preview={{ src: img.url }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                />
              )}

              {/* Index badge */}
              {idx === 0 && !img.uploading && !img.error && (
                <div style={{
                  position: 'absolute', top: 3, left: 3,
                  background: '#b45309', color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  padding: '1px 5px', borderRadius: 4,
                }}>
                  ĐẠI DIỆN
                </div>
              )}

              {/* Action overlay */}
              {!img.uploading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  gap: 4, padding: 4,
                  opacity: 0,
                  transition: 'all 0.2s',
                }}
                  className="img-overlay"
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  {idx !== 0 && !img.error && (
                    <Tooltip title="Đặt làm ảnh đại diện">
                      <button
                        onClick={() => handleSetPrimary(idx)}
                        style={{
                          background: '#b45309', color: '#fff',
                          border: 'none', borderRadius: 4,
                          padding: '3px 6px', cursor: 'pointer', fontSize: 10,
                        }}
                      >
                        Đại diện
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip title="Xóa ảnh">
                    <button
                      onClick={() => handleRemove(idx)}
                      style={{
                        background: '#ef4444', color: '#fff',
                        border: 'none', borderRadius: 4,
                        padding: '3px 6px', cursor: 'pointer',
                      }}
                    >
                      <DeleteOutlined style={{ fontSize: 11 }} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Manual URL Input ─────────────────────────────────────── */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 8,
        padding: '10px 12px',
        background: '#f9fafb',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <LinkOutlined />
          <span>Hoặc nhập URL ảnh thủ công (Cloudinary, Unsplash, Google Drive...)</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManualUrl()}
            placeholder="https://res.cloudinary.com/..."
            disabled={isMaxed}
            style={{
              flex: 1,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              fontFamily: 'monospace',
              background: isMaxed ? '#f3f4f6' : '#fff',
              outline: 'none',
            }}
          />
          <Button
            type="dashed"
            size="small"
            onClick={handleAddManualUrl}
            disabled={isMaxed || !manualUrl.trim()}
            icon={<LinkOutlined />}
          >
            Thêm URL
          </Button>
        </div>
      </div>

      {/* ── Summary ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {validImages.length > 0 && (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {validImages.length} ảnh sẵn sàng
          </Tag>
        )}
        {hasError && (
          <Tag icon={<WarningOutlined />} color="error">
            Có ảnh upload thất bại — Vui lòng xóa và thử lại
          </Tag>
        )}
        {isMaxed && (
          <Tag color="orange">Đã đạt tối đa {maxImages} ảnh</Tag>
        )}
      </div>

      <style>{`
        .img-overlay:hover { background: rgba(0,0,0,0.35) !important; opacity: 1 !important; }
      `}</style>
    </div>
  );
}
