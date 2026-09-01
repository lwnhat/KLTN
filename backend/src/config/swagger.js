/**
 * SWAGGER / OPENAPI 3.0 SPECIFICATION
 * KLTN Fine Jewelry API Documentation
 */
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '💎 KLTN Fine Jewelry E-Commerce API',
    version: '1.0.0',
    description: `
## Khóa Luận Tốt Nghiệp: Hệ Thống Thương Mại Điện Tử Chuyên Biệt Ngành Trang Sức
Hệ thống cung cấp đầy đủ các API RESTful phục vụ cho Storefront (Khách hàng) và Back-office Dashboard (Quản trị viên).

### 🛡️ Tính Năng Nổi Bật:
- **ACID Transactional Integrity**: Bảo toàn tuyệt đối dữ liệu đơn hàng và tồn kho bằng Pessimistic Lock (\`SELECT FOR UPDATE\`).
- **Distributed Inventory Hold**: Tự động tạm giữ tồn kho 15 phút bằng Redis TTL & Keyspace Notifications.
- **Bảo mật Dual-Token**: Access Token (15m) + Refresh Token Rotation (7d) độc quyền trong **HttpOnly Cookie** chống XSS/CSRF.
- **Thanh toán VietQR Napas 24/7**: Tự động sinh mã chuẩn EMVCo QR Code và mô phỏng xác nhận tiền về realtime qua Socket.io.
- **Nghiệp vụ Chuyên Sâu**: Kiểm định GIA/DOJI, Khắc chữ Laser mặt trong nhẫn, Bảo hành điện tử tra cứu theo SĐT.
    `,
    contact: {
      name: 'KLTN Fine Jewelry Team',
      email: 'support@kltn-jewelry.vn',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server (v1)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT Access Token (hạn 15 phút) nhận được từ API Đăng Nhập.',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
        description: 'HttpOnly Cookie tự động lưu Refresh Token (7 ngày) bảo vệ chống XSS.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['customer', 'staff', 'manager', 'admin'] },
          isVerified: { type: 'boolean' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          material: { type: 'string' },
          base_price: { type: 'number' },
          category_name: { type: 'string' },
          allow_engraving: { type: 'boolean' },
          primary_image: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          order_number: { type: 'string', example: 'TJ-20260822-00001' },
          total_amount: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed', 'cancelled'] },
          payment_status: { type: 'string', enum: ['unpaid', 'paid', 'refunded'] },
          payment_method: { type: 'string', enum: ['vietqr', 'vnpay', 'momo', 'cod'] },
        },
      },
      VietQRResponse: {
        type: 'object',
        properties: {
          qrUrl: { type: 'string' },
          quickLinkUrl: { type: 'string' },
          emvcoPayload: { type: 'string' },
          bank: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'TCB' },
              name: { type: 'string', example: 'Techcombank' },
            },
          },
          accountNo: { type: 'string', example: '3345678944' },
          amount: { type: 'number', example: 18900000 },
          transferContent: { type: 'string', example: 'THANH TOAN DON HANG TJ-20260822-00001' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Đăng ký, Đăng nhập, HttpOnly Token, Đổi mật khẩu, OTP' },
    { name: 'Products', description: 'Catalog sản phẩm trang sức, biến thể, kiểm định GIA' },
    { name: 'Orders', description: 'Tạo đơn hàng ACID Transaction, Huỷ đơn, Theo dõi timeline' },
    { name: 'Payments', description: 'Thanh toán VietQR Napas 24/7, Danh sách ngân hàng, Webhook' },
    { name: 'Warranties', description: 'Tra cứu phiếu bảo hành điện tử theo SĐT/Mã' },
    { name: 'Vouchers', description: 'Kiểm tra & áp dụng mã giảm giá' },
    { name: 'Reviews', description: 'Đánh giá & nhận xét sản phẩm đã mua' },
    { name: 'Wishlist', description: 'Danh sách sản phẩm yêu thích' },
    { name: 'Admin', description: 'Thống kê KPI Dashboard realtime & Quản trị Back-office' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng ký tài khoản khách hàng mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'Password123' },
                  fullName: { type: 'string', example: 'Nguyễn Văn A' },
                  phone: { type: 'string', example: '0901234567' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Đăng ký thành công, gửi mã OTP xác thực qua Email' },
          400: { description: 'Dữ liệu không hợp lệ hoặc Email đã tồn tại' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng nhập hệ thống (Cấp AccessToken 15m & HttpOnly Cookie)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@jewelry.com' },
                  password: { type: 'string', example: 'Admin@123456' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Đăng nhập thành công, Set-Cookie HttpOnly Refresh Token',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string', example: 'refresh_token=***; HttpOnly; SameSite=Lax; Max-Age=604800' },
              },
            },
          },
          401: { description: 'Sai email hoặc mật khẩu' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Làm mới Access Token & Xoay vòng Refresh Token (RTR)',
        description: 'Trình duyệt tự động gửi kèm HttpOnly Cookie refresh_token để nhận AccessToken mới và xoay vòng RefreshToken.',
        security: [{ CookieAuth: [] }],
        responses: {
          200: { description: 'Cấp AccessToken mới & Cập nhật HttpOnly Cookie mới' },
          401: { description: 'Refresh Token không hợp lệ hoặc phát hiện Token Reuse' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng xuất & Xóa HttpOnly Cookie',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Đăng xuất thành công' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Lấy thông tin tài khoản đang đăng nhập',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Thông tin User' },
          401: { description: 'Chưa đăng nhập' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Lấy danh sách sản phẩm (Filter, Search, Phân trang)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Slug danh mục (nhan, day-chuyen...)' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Từ khóa tìm kiếm' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: { description: 'Danh sách sản phẩm thành công' },
        },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Xem chi tiết sản phẩm, các biến thể & Giấy kiểm định GIA',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Chi tiết sản phẩm' },
          404: { description: 'Sản phẩm không tồn tại' },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Tạo đơn hàng mới (ACID Transaction + Pessimistic Lock + Idempotency Key)',
        description: 'Tự động kiểm tra tồn kho, khóa biến thể, áp dụng voucher, tạo phiếu bảo hành và trừ kho an toàn.',
        parameters: [
          { name: 'X-Idempotency-Key', in: 'header', schema: { type: 'string' }, description: 'Khóa chống trùng lặp giao dịch' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items', 'shippingAddress', 'customerInfo', 'paymentMethod'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        variantId: { type: 'string', format: 'uuid' },
                        quantity: { type: 'integer', default: 1 },
                        customizationMetadata: {
                          type: 'object',
                          properties: {
                            text: { type: 'string', example: 'Forever with you' },
                            font: { type: 'string', example: 'Classic' },
                            position: { type: 'string', example: 'inner_band' },
                          },
                        },
                      },
                    },
                  },
                  shippingAddress: { type: 'object' },
                  customerInfo: { type: 'object' },
                  paymentMethod: { type: 'string', enum: ['vietqr', 'vnpay', 'momo', 'cod'] },
                  voucherCode: { type: 'string', example: 'WELCOME2026' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Đặt hàng thành công' },
          400: { description: 'Tồn kho không đủ hoặc Voucher không hợp lệ' },
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'Lấy danh sách đơn hàng của người dùng hiện tại',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Danh sách đơn hàng' },
        },
      },
    },
    '/orders/{orderNumber}': {
      get: {
        tags: ['Orders'],
        summary: 'Theo dõi tiến trình đơn hàng (Timeline, Sản phẩm, Bảo hành)',
        parameters: [
          { name: 'orderNumber', in: 'path', required: true, schema: { type: 'string', example: 'TJ-20260822-00001' } },
        ],
        responses: {
          200: { description: 'Chi tiết đơn hàng' },
          404: { description: 'Không tìm thấy đơn hàng' },
        },
      },
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Hủy đơn hàng đang chờ xử lý & Tự động hoàn trả kho',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Đã hủy đơn hàng' },
          400: { description: 'Không thể hủy đơn ở trạng thái hiện tại' },
        },
      },
    },
    '/payments/vietqr/generate': {
      post: {
        tags: ['Payments'],
        summary: 'Tạo mã VietQR Napas 24/7 chuẩn EMVCo Payload',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderNumber'],
                properties: {
                  orderNumber: { type: 'string', example: 'TJ-20260822-00001' },
                  amount: { type: 'number', example: 18900000 },
                  bankCode: { type: 'string', example: 'TCB' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Mã QR thanh toán VietQR Techcombank',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VietQRResponse' } } },
          },
        },
      },
    },
    '/payments/banks': {
      get: {
        tags: ['Payments'],
        summary: 'Lấy danh sách 65+ ngân hàng hỗ trợ VietQR tại Việt Nam',
        responses: {
          200: { description: 'Danh sách ngân hàng (MB, VCB, TCB, ACB, BIDV...)' },
        },
      },
    },
    '/payments/vietqr/simulate-paid': {
      post: {
        tags: ['Payments'],
        summary: '⚡ Webhook mô phỏng ngân hàng báo tiền về (Demo IPN Realtime)',
        description: 'Cập nhật trạng thái đơn sang paid và tự động bắn sự kiện Socket.io tới màn hình khách hàng.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderNumber'],
                properties: {
                  orderNumber: { type: 'string', example: 'TJ-20260822-00001' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Xác nhận thanh toán thành công qua Socket.io' },
        },
      },
    },
    '/warranties/lookup': {
      get: {
        tags: ['Warranties'],
        summary: 'Tra cứu phiếu bảo hành điện tử theo Số điện thoại hoặc Mã bảo hành',
        parameters: [
          { name: 'query', in: 'query', required: true, schema: { type: 'string' }, description: 'Số điện thoại hoặc mã WR-...' },
        ],
        responses: {
          200: { description: 'Danh sách phiếu bảo hành và quyền lợi đi kèm' },
        },
      },
    },
    '/vouchers/validate': {
      post: {
        tags: ['Vouchers'],
        summary: 'Kiểm tra & tính toán số tiền giảm giá của Voucher',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'orderAmount'],
                properties: {
                  code: { type: 'string', example: 'WELCOME2026' },
                  orderAmount: { type: 'number', example: 35000000 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Áp dụng mã giảm giá thành công' },
          400: { description: 'Mã không hợp lệ hoặc không đủ giá trị tối thiểu' },
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Lấy dữ liệu thống kê Dashboard realtime (KPIs, Biểu đồ 7 ngày, Top Bán Chạy)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Dữ liệu thống kê doanh thu và đơn hàng' },
          403: { description: 'Yêu cầu quyền Quản trị (Staff, Manager, Admin)' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/modules/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
