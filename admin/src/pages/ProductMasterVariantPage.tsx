import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input,
  InputNumber, Select, Switch, Typography, message, Popconfirm,
  Image, Row, Col, Divider, Tabs, List, Avatar, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  SkinOutlined, PictureOutlined, LinkOutlined
} from '@ant-design/icons';
import CloudinaryUploader from '../components/CloudinaryUploader';

const { Title, Text } = Typography;
import { API_BASE, adminFetch } from '../lib/api';
const API = API_BASE;

export default function ProductMasterVariantPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.data || []);
        }
      })
      .catch(() => {});
  }, []);


  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Variant Modal State
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [variantForm] = Form.useForm();
  const [variantSubmitting, setVariantSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  // ─────────────────────────────────────────────────────────────────────
  // PRODUCT CRUD
  // ─────────────────────────────────────────────────────────────────────
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', status: 'all' });
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      const res = await adminFetch(`/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.data || data.data || []);
        setPagination(p => ({ ...p, current: page, total: data.data.pagination?.total || 0 }));
      }
    } catch {
      message.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [search, filterCategory]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingProduct(record);
    form.setFieldsValue({
      name: record.name,
      categoryId: record.category_id,
      material: record.material,
      basePrice: record.base_price,
      shortDescription: record.short_description,
      brand: record.brand || 'KLTN Fine Jewelry',
      status: record.status || 'active',
      isFeatured: record.is_featured,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const endpoint = editingProduct ? `/products/${editingProduct.id}` : `/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await adminFetch(endpoint, { method, body: JSON.stringify(values) });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success(editingProduct ? 'Đã cập nhật sản phẩm!' : 'Tạo sản phẩm mới thành công!');
        setModalOpen(false);
        fetchProducts(pagination.current);
      } else {
        message.error(data.error?.message || 'Thao tác thất bại');
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success('Đã xóa sản phẩm thành công.');
        fetchProducts(pagination.current);
      } else {
        message.error(data.error?.message || 'Không thể xóa sản phẩm.');
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // VARIANT & IMAGE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────
  const handleOpenVariants = async (product: any) => {
    setSelectedProduct(product);
    setVariantModalOpen(true);
    setEditingVariant(null);
    variantForm.resetFields();
    setImageUrls(['']);
    setVariantLoading(true);
    try {
      const res = await adminFetch(`/admin/variants?productId=${product.id}`);
      const data = await res.json();
      if (data.success) setVariants(data.data || []);
    } catch {
      message.error('Không thể tải biến thể');
    } finally {
      setVariantLoading(false);
    }
  };

  const handleEditVariant = (v: any) => {
    setEditingVariant(v);
    variantForm.setFieldsValue({
      name: v.name,
      sku: v.sku,
      price: parseFloat(v.price),
      comparePrice: v.compare_price ? parseFloat(v.compare_price) : undefined,
      stockQuantity: v.stock_quantity,
      allowEngraving: v.allow_engraving,
      engravingFee: parseFloat(v.engraving_fee || 0),
      maxEngravingChars: v.max_engraving_chars || 20,
    });
    const urls = (v.images || []).map((img: any) => img.url || img).filter(Boolean);
    setImageUrls(urls.length > 0 ? urls : ['']);
  };

  const handleSubmitVariant = async () => {
    try {
      const values = await variantForm.validateFields();
      setVariantSubmitting(true);
      const validUrls = imageUrls.filter(url => url.trim() !== '');
      const payload = { ...values, imageUrls: validUrls, productId: selectedProduct.id };

      const endpoint = editingVariant
        ? `/admin/variants/${editingVariant.id}`
        : `/admin/variants`;
      const method = editingVariant ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success(editingVariant ? 'Đã cập nhật biến thể!' : 'Tạo biến thể thành công!');
        setEditingVariant(null);
        variantForm.resetFields();
        setImageUrls(['']);
        // Refresh variants
        const r2 = await adminFetch(`/admin/variants?productId=${selectedProduct.id}`);
        const d2 = await r2.json();
        if (d2.success) setVariants(d2.data || []);
        fetchProducts(pagination.current);
      } else {
        message.error(data.error?.message || 'Lỗi khi lưu biến thể');
      }
    } catch (e: any) {
      if (e?.errorFields) return; // Validation error
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      const res = await adminFetch(`/admin/variants/${variantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success('Đã xóa biến thể.');
        setVariants(prev => prev.filter(v => v.id !== variantId));
      } else {
        message.error(data.error?.message || 'Không thể xóa');
      }
    } catch {
      message.error('Lỗi kết nối');
    }
  };


  // ─────────────────────────────────────────────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'primary_image',
      key: 'primary_image',
      width: 80,
      render: (img: string) =>
        img ? (
          <Image src={img} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PictureOutlined style={{ color: '#bbb' }} />
          </div>
        ),
    },
    {
      title: 'Sản Phẩm',
      key: 'product',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.material} — {record.category_name}</Text>
        </div>
      ),
    },
    {
      title: 'Giá cơ bản',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (v: number) => <Text strong>{parseFloat(String(v)).toLocaleString('vi-VN')}₫</Text>,
    },
    {
      title: 'Biến thể',
      dataIndex: 'variant_count',
      key: 'variant_count',
      render: (v: number) => (
        <Tag color={v > 0 ? 'blue' : 'default'}>{v || 0} biến thể</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : s === 'draft' ? 'orange' : 'default'}>
          {s === 'active' ? 'Đang bán' : s === 'draft' ? 'Nháp' : 'Lưu trữ'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Quản lý biến thể & ảnh">
            <Button
              size="small"
              icon={<PictureOutlined />}
              onClick={() => handleOpenVariants(record)}
            >
              Biến Thể
            </Button>
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa" cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header Title & Stats ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            👑 QUẢN LÝ SẢN PHẨM & BIẾN THỂ TRANG SỨC (PIM)
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Quản lý danh mục Master-Variant, bộ sưu tập đá quý, vàng 18K/24K và dịch vụ khắc laser
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
            borderColor: '#b45309',
            fontWeight: 700,
            borderRadius: 10,
            boxShadow: '0 4px 14px rgba(180, 83, 9, 0.3)',
          }}
        >
          + Thêm Sản Phẩm Mới
        </Button>
      </div>

      <Card className="luxury-card">
        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <Space wrap size={12}>
            <Input.Search
              placeholder="Tìm theo tên sản phẩm, chất liệu..."
              onSearch={setSearch}
              style={{ width: 320 }}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
            />
            <Select
              placeholder="Lọc theo danh mục"
              allowClear
              style={{ width: 220 }}
              onChange={setFilterCategory}
              options={categories.map(c => ({
                value: c.slug,
                label: `${c.name} (${c.slug})`,
              }))}
            />
          </Space>

          <Tag color="gold" style={{ fontWeight: 600, padding: '4px 12px', borderRadius: 6 }}>
            Tổng: {pagination.total || products.length} sản phẩm
          </Tag>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (p) => fetchProducts(p),
            showTotal: (t) => `Tổng cộng ${t} sản phẩm`,
          }}
          size="middle"
        />
      </Card>


      {/* ── Modal Thêm/Sửa Sản Phẩm ─────────────────────────────────── */}
      <Modal
        open={modalOpen}
        title={editingProduct ? `Chỉnh Sửa: ${editingProduct.name}` : 'Thêm Sản Phẩm Mới'}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingProduct ? 'Lưu Thay Đổi' : 'Tạo Mới'}
        cancelText="Hủy"
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="VD: Nhẫn Kim Cương Solitaire 18K Luxury" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Danh mục trang sức"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục trang sức' }]}
              >
                <Select
                  placeholder="-- Chọn danh mục --"
                  options={categories.map(c => ({
                    value: c.id,
                    label: `${c.name} (${c.slug})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chất liệu" name="material" initialValue="Vàng 18K" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Vàng 18K', label: 'Vàng 18K (750)' },
                  { value: 'Vàng 24K', label: 'Vàng 24K (999.9)' },
                  { value: 'Vàng Trắng 18K', label: 'Vàng Trắng 18K' },
                  { value: 'Bạch Kim (Platinum)', label: 'Bạch Kim (Platinum)' },
                  { value: 'Bạc 925 Cao Cấp', label: 'Bạc 925 Cao Cấp' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Giá cơ bản (VND)" name="basePrice" rules={[{ required: true, message: 'Nhập giá' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="35000000" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thương hiệu" name="brand" initialValue="KLTN Fine Jewelry">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Trạng thái" name="status" initialValue="active">
                <Select options={[
                  { value: 'active', label: 'Đang kinh doanh (Active)' },
                  { value: 'draft', label: 'Bản nháp (Draft)' },
                  { value: 'archived', label: 'Lưu trữ (Archived)' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Sản phẩm nổi bật (Trang chủ)" name="isFeatured" valuePropName="checked">
                <Switch style={{ marginTop: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả ngắn" name="shortDescription">
            <Input.TextArea rows={2} placeholder="Vàng 18K đính Kim Cương GIA, miễn phí khắc chữ laser..." />
          </Form.Item>

          {!editingProduct && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
              💡 Sau khi tạo sản phẩm, bấm nút <strong>"Biến Thể"</strong> trong danh sách để thêm ảnh và biến thể (màu sắc, kích cỡ, SKU).
            </div>
          )}
        </Form>
      </Modal>

      {/* ── Modal Quản Lý Biến Thể & Ảnh ─────────────────────────────── */}
      <Modal
        open={variantModalOpen}
        title={
          <span>
            <PictureOutlined /> Biến Thể & Ảnh — <strong>{selectedProduct?.name}</strong>
          </span>
        }
        onCancel={() => { setVariantModalOpen(false); setEditingVariant(null); variantForm.resetFields(); setImageUrls(['']); }}
        footer={null}
        width={820}
      >
        <Tabs
          defaultActiveKey="list"
          items={[
            {
              key: 'list',
              label: `Danh sách biến thể (${variants.length})`,
              children: (
                <List
                  loading={variantLoading}
                  dataSource={variants}
                  locale={{ emptyText: 'Chưa có biến thể nào. Chuyển sang tab "Thêm Biến Thể" để thêm mới.' }}
                  renderItem={(v: any) => {
                    const firstImg = v.images?.[0]?.url;
                    return (
                      <List.Item
                        actions={[
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditVariant(v)}
                          >
                            Sửa
                          </Button>,
                          <Popconfirm
                            title="Xóa biến thể này?"
                            onConfirm={() => handleDeleteVariant(v.id)}
                            okText="Xóa" cancelText="Hủy"
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            firstImg ? (
                              <Image src={firstImg} width={64} height={64} style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                            ) : (
                              <Avatar shape="square" size={64} icon={<PictureOutlined />} style={{ background: '#f5f5f5', color: '#bbb' }} />
                            )
                          }
                          title={
                            <Space>
                              <Text strong>{v.name}</Text>
                              <Tag color="blue">SKU: {v.sku}</Tag>
                              {v.allow_engraving && <Tag color="purple">Khắc chữ Laser</Tag>}
                              {!v.is_active && <Tag color="red">Đã ẩn</Tag>}
                            </Space>
                          }
                          description={
                            <Space size="large">
                              <span>Giá: <strong>{parseFloat(v.price).toLocaleString('vi-VN')}₫</strong></span>
                              <span>Kho: <strong>{v.stock_quantity}</strong></span>
                              <span>Ảnh: <strong>{(v.images || []).length}</strong></span>
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ),
            },
            {
              key: 'add',
              label: editingVariant ? '✏️ Sửa Biến Thể' : '➕ Thêm Biến Thể',
              children: (
                <Form form={variantForm} layout="vertical">
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Tên biến thể" name="name" rules={[{ required: true, message: 'Nhập tên biến thể' }]}>
                        <Input placeholder="VD: Vàng 18K - Nhẫn Size 12" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="SKU" name="sku" rules={[{ required: true, message: 'Nhập SKU' }]}>
                        <Input placeholder="VD: NKC-18K-S12-001" style={{ fontFamily: 'monospace' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Giá bán (VND)" name="price" rules={[{ required: true, message: 'Nhập giá bán' }]}>
                        <InputNumber
                          min={0} style={{ width: '100%' }}
                          placeholder="35000000"
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Giá gốc / Niêm yết (VND)" name="comparePrice">
                        <InputNumber
                          min={0} style={{ width: '100%' }}
                          placeholder="40000000 (tùy chọn)"
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Số lượng tồn kho" name="stockQuantity" initialValue={10}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  {/* ── Upload ảnh Cloudinary ──────────────────────── */}
                  <Divider orientation="left">
                    <PictureOutlined /> Ảnh Sản Phẩm
                  </Divider>

                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
                    📸 Upload ảnh trực tiếp lên <strong>Cloudinary CDN</strong> — tự động nén WebP, resize tối ưu. Ảnh đầu tiên là ảnh đại diện sản phẩm.
                  </div>

                  <CloudinaryUploader
                    value={imageUrls.filter(Boolean)}
                    onChange={setImageUrls}
                    folder={`mn-jewelry/products`}
                    maxImages={8}
                  />

                  <Divider orientation="left">Khắc Chữ Laser</Divider>

                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item label="Cho phép khắc chữ" name="allowEngraving" valuePropName="checked" initialValue={false}>
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Phí khắc (VND)" name="engravingFee" initialValue={0}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Số ký tự tối đa" name="maxEngravingChars" initialValue={20}>
                        <InputNumber min={5} max={50} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    {editingVariant && (
                      <Button onClick={() => { setEditingVariant(null); variantForm.resetFields(); setImageUrls(['']); }}>
                        Hủy sửa
                      </Button>
                    )}
                    <Button
                      type="primary"
                      onClick={handleSubmitVariant}
                      loading={variantSubmitting}
                      style={{ background: '#111' }}
                      icon={editingVariant ? <EditOutlined /> : <PlusOutlined />}
                    >
                      {editingVariant ? 'Lưu Thay Đổi' : 'Thêm Biến Thể'}
                    </Button>
                  </Space>
                </Form>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}

