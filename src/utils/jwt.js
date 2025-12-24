const jwt = require("jsonwebtoken");

class JWTUtil {
  /**
   * Tạo JWT token
   */
  static generateToken(payload, expiresIn = "7d") {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
    });
  }

  /**
   * Xác thực JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Tạo cặp Access Token + Refresh Token
   */
  static generateTokenPair(userId, email, role) {
    const payload = {
      userId,
      email,
      role,
    };

    const accessToken = this.generateToken(payload, "15m"); // 15 phút
    const refreshToken = this.generateToken(payload, "7d"); // 7 ngày

    return { accessToken, refreshToken };
  }

  /**
   * Decode token mà không verify (dùng để debug)
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtil;
