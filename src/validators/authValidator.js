const Joi = require("joi");
const emailValidator = require("email-validator");

/**
 * Danh sách email providers hợp lệ
 * Chặn email 10 phút, email tạm
 */
const VALID_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  // Thêm các domain hợp lệ khác nếu cần
];

/**
 * Custom validator cho email hợp lệ
 */
const validEmailDomain = (value, helpers) => {
  // Kiểm tra format email
  if (!emailValidator.validate(value)) {
    return helpers.error("string.email");
  }

  // Lấy domain từ email
  const domain = value.split("@")[1]?.toLowerCase();

  // Kiểm tra domain có trong danh sách hợp lệ không
  if (!VALID_EMAIL_DOMAINS.includes(domain)) {
    return helpers.message(
      "Email phải sử dụng nhà cung cấp hợp lệ (Gmail, Yahoo, Outlook...)"
    );
  }

  return value;
};

/**
 * Schema cho đăng ký
 */
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    "string.alphanum": "Username chỉ được chứa chữ và số",
    "string.min": "Username phải có ít nhất 3 ký tự",
    "string.max": "Username không được quá 50 ký tự",
    "any.required": "Username là bắt buộc",
  }),

  email: Joi.string().custom(validEmailDomain).required().messages({
    "any.required": "Email là bắt buộc",
    "string.email": "Email không hợp lệ",
  }),

  password: Joi.string().min(6).max(100).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "string.max": "Mật khẩu không được quá 100 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),

  full_name: Joi.string().max(100).optional().messages({
    "string.max": "Họ tên không được quá 100 ký tự",
  }),
});

/**
 * Schema cho đăng nhập
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),

  password: Joi.string().required().messages({
    "any.required": "Mật khẩu là bắt buộc",
  }),
});

/**
 * Middleware validate
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Hiển thị tất cả lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true, // Loại bỏ các field không có trong schema
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      return res.status(400).json({
        status: "error",
        message: "Dữ liệu không hợp lệ",
        errors,
      });
    }

    // Gán giá trị đã validate vào req.body
    req.body = value;
    next();
  };
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};
