const db = require("../models");
const JWTUtil = require("../utils/jwt");
const EmailService = require("./emailService");
const { Op } = require("sequelize");

class AuthService {
  /**
   * Đăng ký user mới
   */
  static async register(userData) {
    const { username, email, password, full_name } = userData;

    // 1. Kiểm tra email hoặc username đã tồn tại chưa
    const existingUser = await db.User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("Email đã được sử dụng");
      }
      if (existingUser.username === username) {
        throw new Error("Username đã được sử dụng");
      }
    }

    // 2. Tạo user mới (is_verified = false mặc định)
    const newUser = await db.User.create({
      username,
      email,
      password_hash: password, // Sẽ tự động hash
      full_name: full_name || null,
      role_id: 1, // Default role: user
      is_verified: false, // QUAN TRỌNG: Chưa xác thực
    });

    // 3. Tạo verification token
    const verificationToken = await db.VerificationToken.createToken(
      newUser.id,
      "email_verification"
    );

    // 4. Gửi email xác thực
    try {
      await EmailService.sendVerificationEmail(
        newUser.email,
        newUser.full_name || newUser.username,
        verificationToken.token
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Không throw error để user vẫn đăng ký được
      // Họ có thể resend email sau
    }

    // 5. Tạo JWT token (cho phép login nhưng cần verify email)
    const { accessToken, refreshToken } = JWTUtil.generateTokenPair(
      newUser.id,
      newUser.email,
      "user"
    );

    // 6. Trả về user
    return {
      user: newUser,
      tokens: {
        accessToken,
        refreshToken,
      },
      message:
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
    };
  }

  /**
   * Đăng nhập
   */
  static async login(email, password) {
    // 1. Tìm user (kèm password để so sánh)
    const user = await db.User.scope("withPassword").findOne({
      where: { email },
      include: [
        {
          model: db.Role,
          as: "role",
          attributes: ["name"],
        },
      ],
    });

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // 2. Kiểm tra password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // 3. Cập nhật trạng thái online
    await user.update({
      is_online: true,
      last_active_at: new Date(),
    });

    // 4. Tạo JWT token
    const { accessToken, refreshToken } = JWTUtil.generateTokenPair(
      user.id,
      user.email,
      user.role.name
    );

    // 5. Loại bỏ password trước khi trả về
    const userResponse = user.toJSON();

    return {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Lấy thông tin user từ token
   */
  static async getProfile(userId) {
    const user = await db.User.findByPk(userId, {
      include: [
        {
          model: db.Role,
          as: "role",
          attributes: ["name"],
        },
      ],
    });

    if (!user) {
      throw new Error("User không tồn tại");
    }

    return user;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = JWTUtil.verifyToken(refreshToken);

      // Kiểm tra user còn tồn tại không
      const user = await db.User.findByPk(decoded.userId);
      if (!user) {
        throw new Error("User không tồn tại");
      }

      // Tạo access token mới
      const { accessToken } = JWTUtil.generateTokenPair(
        user.id,
        user.email,
        decoded.role
      );

      return { accessToken };
    } catch (error) {
      throw new Error("Refresh token không hợp lệ");
    }
  }

  /**
   * Đăng xuất
   */
  static async logout(userId) {
    const user = await db.User.findByPk(userId);

    if (user) {
      await user.update({
        is_online: false,
        last_active_at: new Date(),
      });
    }

    return true;
  }

  /**
   * Xác thực email
   */
  static async verifyEmail(token) {
    // 1. Tìm token
    const verificationToken = await db.VerificationToken.findOne({
      where: {
        token,
        type: "email_verification",
        used_at: null,
      },
      include: [
        {
          model: db.User,
          as: "user",
        },
      ],
    });

    if (!verificationToken) {
      throw new Error("Token không hợp lệ hoặc đã được sử dụng");
    }

    // 2. Kiểm tra token còn hạn không
    if (verificationToken.isExpired()) {
      throw new Error(
        "Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực"
      );
    }

    // 3. Update user is_verified = true
    await verificationToken.user.update({
      is_verified: true,
    });

    // 4. Đánh dấu token đã sử dụng
    await verificationToken.markAsUsed();

    return {
      success: true,
      user: verificationToken.user,
    };
  }

  /**
   * Gửi lại email xác thực
   */
  static async resendVerificationEmail(userId) {
    // 1. Tìm user
    const user = await db.User.findByPk(userId);

    if (!user) {
      throw new Error("User không tồn tại");
    }

    // 2. Kiểm tra đã verify chưa
    if (user.is_verified) {
      throw new Error("Tài khoản đã được xác thực rồi");
    }

    // 3. Tạo token mới (sẽ tự động xóa token cũ)
    const verificationToken = await db.VerificationToken.createToken(
      user.id,
      "email_verification"
    );

    // 4. Gửi email
    await EmailService.sendVerificationEmail(
      user.email,
      user.full_name || user.username,
      verificationToken.token
    );

    return {
      success: true,
      message: "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.",
    };
  }
}

module.exports = AuthService;
