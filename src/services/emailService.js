// src/services/emailService.js
const nodemailer = require("nodemailer");
const { formatEmailDateTime } = require("../utils/dateUtils");

class EmailService {
  constructor() {
    // Khởi tạo transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true cho port 465, false cho 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Gửi email xác thực tài khoản
   */
  async sendVerificationEmail(userEmail, userName, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const sentAt = formatEmailDateTime(new Date());

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: "🎉 Xác thực tài khoản của bạn",
      html: this.getVerificationEmailTemplate(
        userName,
        verificationUrl,
        sentAt
      ),
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Template HTML cho email xác thực
   */
  getVerificationEmailTemplate(userName, verificationUrl, sentAt) {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f7f6;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0,0,0,0.06);
      border: 1px solid #eaeaea;
    }

    .header {
      text-align: center;
      padding: 35px 20px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .brand-icon {
      font-size: 42px;
      margin-bottom: 10px;
      display: block;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      color: #667eea;
    }

    .sent-time {
      margin-top: 8px;
      font-size: 13px;
      color: #718096;
    }

    .content {
      padding: 40px;
      color: #4a5568;
      font-size: 16px;
      line-height: 1.8;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 20px;
    }

    .button-container {
      text-align: center;
      margin: 35px 0;
    }

    .button {
      display: inline-block;
      padding: 14px 42px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 999px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 6px 15px rgba(102,126,234,0.35);
    }

    .note {
      margin-top: 30px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 10px;
      font-size: 14px;
      color: #718096;
    }

    .alternative {
      margin-top: 25px;
      font-size: 14px;
    }

    .alternative a {
      color: #667eea;
      word-break: break-all;
    }

    .footer {
      text-align: center;
      padding: 28px;
      background: #f8fafc;
      font-size: 13px;
      color: #a0aec0;
      border-top: 1px solid #f0f0f0;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <span class="brand-icon">🎉</span>
      <h1>Chào mừng đến với ${process.env.EMAIL_FROM_NAME}</h1>
      <div class="sent-time">📩 Email được gửi lúc ${sentAt}</div>
    </div>

    <div class="content">
      <div class="greeting">Xin chào ${userName},</div>

      <p>
        Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình và bảo vệ tài khoản,
        vui lòng xác minh địa chỉ email của bạn bằng cách nhấn nút bên dưới.
      </p>

      <div class="button-container">
        <a href="${verificationUrl}" class="button">
          Xác Thực Tài Khoản
        </a>
      </div>

      <div class="note">
        ⏰ <strong>Lưu ý:</strong> Liên kết xác thực chỉ có hiệu lực trong vòng <strong>24 giờ</strong>.
        Vui lòng sử dụng email mới nhất nếu bạn nhận được nhiều email.
      </div>

      <div class="alternative">
        Nếu nút không hoạt động, hãy sao chép liên kết sau và dán vào trình duyệt:
        <br />
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>
    </div>

    <div class="footer">
      <p>Email này được gửi từ ${process.env.EMAIL_FROM_NAME}.</p>
      <p>Nếu không phải bạn thực hiện, hãy bỏ qua email này.</p>
      <p>&copy; ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME}</p>
    </div>
  </div>
</body>
</html>
`;
  }

  /**
   * Gửi email reset password (dành cho tương lai)
   */
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: "🔐 Đặt lại mật khẩu của bạn",
      html: `
        <h1>Xin chào ${userName},</h1>
        <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
        <p>Click vào link dưới đây để đặt lại mật khẩu (có hiệu lực trong 1 giờ):</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Đặt lại mật khẩu
        </a>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Email error:", error);
      throw new Error("Không thể gửi email đặt lại mật khẩu");
    }
  }
}

module.exports = new EmailService();
