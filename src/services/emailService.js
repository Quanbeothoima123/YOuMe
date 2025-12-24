const nodemailer = require("nodemailer");

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

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: "🎉 Xác thực tài khoản của bạn",
      html: this.getVerificationEmailTemplate(userName, verificationUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Email error:", error);
      throw new Error("Không thể gửi email xác thực");
    }
  }

  /**
   * Template HTML cho email xác thực
   */
  getVerificationEmailTemplate(userName, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
          }
          .content p {
            margin: 15px 0;
            font-size: 16px;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            margin: 25px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
          }
          .button:hover {
            opacity: 0.9;
          }
          .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            color: #666666;
            font-size: 14px;
          }
          .alternative-link {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f8f8;
            border-radius: 5px;
            word-break: break-all;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với ${process.env.EMAIL_FROM_NAME}!</h1>
          </div>
          
          <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Cảm ơn bạn đã đăng ký tài khoản! Chỉ còn một bước nữa thôi.</p>
            
            <p>Vui lòng click vào nút bên dưới để xác thực địa chỉ email của bạn:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                Xác Thực Email
              </a>
            </div>
            
            <p><strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong vòng <strong>24 giờ</strong>.</p>
            
            <p>Nếu bạn không thể click vào nút, hãy copy link dưới đây và dán vào trình duyệt:</p>
            
            <div class="alternative-link">
              ${verificationUrl}
            </div>
            
            <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
            
            <p>Trân trọng,<br><strong>Đội ngũ ${process.env.EMAIL_FROM_NAME}</strong></p>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; 2024 ${process.env.EMAIL_FROM_NAME}. All rights reserved.</p>
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
