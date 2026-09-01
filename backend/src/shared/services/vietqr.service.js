/**
 * VIETQR (NAPAS 24/7) PAYMENT SERVICE
 * Tích hợp chuẩn VietQR quốc gia (EMVCo QR Code standard & VietQR Open API v2)
 */
const QRCode = require('qrcode');

// Danh sách ngân hàng phổ biến tại Việt Nam với mã BIN Napas (Techcombank mặc định)
const POPULAR_BANKS = [
  { bin: '970407', code: 'TCB', name: 'Ngân hàng Kỹ Thương (Techcombank)', shortName: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
  { bin: '970422', code: 'MB', name: 'Ngân hàng Quân Đội (MBBank)', shortName: 'MBBank', logo: 'https://api.vietqr.io/img/MB.png' },
  { bin: '970436', code: 'VCB', name: 'Ngân hàng Ngoại Thương (Vietcombank)', shortName: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png' },
  { bin: '970415', code: 'CTG', name: 'Ngân hàng Công Thương (VietinBank)', shortName: 'VietinBank', logo: 'https://api.vietqr.io/img/ICB.png' },
  { bin: '970418', code: 'BIDV', name: 'Ngân hàng Đầu tư & Phát triển (BIDV)', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { bin: '970416', code: 'ACB', name: 'Ngân hàng Á Châu (ACB)', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { bin: '970432', code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png' },
  { bin: '970423', code: 'TPB', name: 'Ngân hàng Tiên Phong (TPBank)', shortName: 'TPBank', logo: 'https://api.vietqr.io/img/TPB.png' },
  { bin: '970403', code: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)', shortName: 'Sacombank', logo: 'https://api.vietqr.io/img/STB.png' },
  { bin: '970448', code: 'OCB', name: 'Ngân hàng Phương Đông (OCB)', shortName: 'OCB', logo: 'https://api.vietqr.io/img/OCB.png' },
];

/**
 * CRC16-CCITT (0xFFFF, Poly 0x1021) theo tiêu chuẩn EMVCo QR Code
 */
function crc16(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Encode Tag-Length-Value theo chuẩn EMVCo
 */
function formatTLV(tag, value) {
  const valStr = String(value);
  const lenStr = valStr.length.toString().padStart(2, '0');
  return `${tag}${lenStr}${valStr}`;
}

/**
 * Tự động tạo chuỗi EMVCo VietQR tiêu chuẩn (Offline Encoder)
 */
function generateEMVCoPayload({ bin, accountNo, amount, transferContent }) {
  // Tag 38: Merchant Account Information (Napas QRIBFTTA)
  const tag00 = formatTLV('00', 'A000000727'); // GUID Napas
  const tag01Sub00 = formatTLV('00', bin);     // Mã BIN ngân hàng (6 số)
  const tag01Sub01 = formatTLV('01', accountNo); // Số tài khoản nhận
  const tag01 = formatTLV('01', `${tag01Sub00}${tag01Sub01}`);
  const tag02 = formatTLV('02', 'QRIBFTTA');   // Chuyển nhanh Napas247 qua tài khoản
  const tag38 = formatTLV('38', `${tag00}${tag01}${tag02}`);

  // Tag 53: Currency (704 = VND)
  const tag53 = formatTLV('53', '704');

  // Tag 54: Amount (nếu có)
  const tag54 = amount ? formatTLV('54', String(Math.round(amount))) : '';

  // Tag 58: Country Code
  const tag58 = formatTLV('58', 'VN');

  // Tag 62: Additional Data (Nội dung chuyển khoản)
  const tag62Sub08 = formatTLV('08', transferContent);
  const tag62 = formatTLV('62', tag62Sub08);

  // Ghép chuỗi payload trước CRC
  const rawWithoutCRC = `${formatTLV('00', '01')}${formatTLV('01', '12')}${tag38}${tag53}${tag54}${tag58}${tag62}6304`;
  const checksum = crc16(rawWithoutCRC);

  return `${rawWithoutCRC}${checksum}`;
}

/**
 * Dịch vụ tạo mã VietQR chính thức
 * @param {Object} params
 * @param {string} params.orderNumber Mã đơn hàng (VD: 'TJ-20260818-00001')
 * @param {number} params.amount Số tiền thanh toán
 * @param {string} [params.bankCode] Mã ngân hàng ('MB', 'VCB', 'TCB'...)
 * @param {string} [params.accountNo] Số tài khoản thụ hưởng
 * @param {string} [params.accountName] Tên chủ tài khoản
 * @param {string} [params.template] 'compact2' | 'compact' | 'qr_only' | 'print'
 */
async function generateVietQR({
  orderNumber,
  amount,
  bankCode = process.env.VIETQR_BANK_ID || 'TCB',
  accountNo = process.env.VIETQR_ACCOUNT_NO || '3345678944',
  accountName = process.env.VIETQR_ACCOUNT_NAME || 'KLTN FINE JEWELRY',
  template = process.env.VIETQR_TEMPLATE || 'compact2',
}) {
  const transferContent = `THANH TOAN DON HANG ${orderNumber}`;
  const bank = POPULAR_BANKS.find(
    (b) => b.code.toUpperCase() === bankCode.toUpperCase() || b.bin === bankCode
  ) || POPULAR_BANKS[0];

  const bin = bank.bin;
  const safeBankCode = bank.code;

  // 1. Tạo Quick Link trực tiếp từ CDN VietQR (Rất nhanh và đẹp)
  const encodedInfo = encodeURIComponent(transferContent);
  const encodedName = encodeURIComponent(accountName);
  const quickLinkUrl = `https://img.vietqr.io/image/${safeBankCode}-${accountNo}-${template}.png?amount=${Math.round(amount)}&addInfo=${encodedInfo}&accountName=${encodedName}`;

  // 2. Tạo chuỗi chuẩn EMVCo String
  const emvcoPayload = generateEMVCoPayload({
    bin,
    accountNo,
    amount,
    transferContent,
  });

  // 3. Sinh mã QR Base64 Data URL (đảm bảo luôn render được 100% offline nếu mất internet)
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(emvcoPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('[VietQR] Failed to generate local QR Base64:', err.message);
  }

  // 4. Thử gọi Open API v2 nếu có API Key hoặc online
  let officialApiResult = null;
  try {
    const apiRes = await fetch('https://api.vietqr.io/v2/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.VIETQR_CLIENT_ID && { 'x-client-id': process.env.VIETQR_CLIENT_ID }),
        ...(process.env.VIETQR_API_KEY && { 'x-api-key': process.env.VIETQR_API_KEY }),
      },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId: bin,
        amount: Math.round(amount),
        addInfo: transferContent,
        format: 'text',
        template,
      }),
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.code === '00' && data.data) {
        officialApiResult = data.data;
      }
    }
  } catch {
    // Fallback sang QuickLink & EMVCo local
  }

  return {
    qrUrl: officialApiResult?.qrDataURL || quickLinkUrl,
    quickLinkUrl,
    qrDataUrl,
    emvcoPayload,
    bank: {
      code: safeBankCode,
      bin,
      name: bank.name,
      shortName: bank.shortName,
      logo: bank.logo,
    },
    accountNo,
    accountName,
    amount: Math.round(amount),
    orderNumber,
    transferContent,
    deeplink: `vietqr://transfer?bank=${safeBankCode}&account=${accountNo}&amount=${Math.round(amount)}&memo=${encodedInfo}`,
  };
}

/**
 * Lấy danh sách toàn bộ các ngân hàng hỗ trợ VietQR
 */
async function getSupportedBanks() {
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks');
    if (res.ok) {
      const data = await res.json();
      if (data.code === '00' && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {
    // Fallback sang danh sách có sẵn
  }
  return POPULAR_BANKS;
}

module.exports = {
  generateVietQR,
  getSupportedBanks,
  POPULAR_BANKS,
  generateEMVCoPayload,
};
