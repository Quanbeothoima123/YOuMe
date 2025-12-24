/**
 * Chuẩn hóa format JSON response
 */

class ApiResponse {
  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  }

  static error(res, message, statusCode = 400, errors = null) {
    const response = {
      status: "error",
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static unauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      status: "error",
      message,
    });
  }

  static forbidden(res, message = "Forbidden") {
    return res.status(403).json({
      status: "error",
      message,
    });
  }

  static notFound(res, message = "Resource not found") {
    return res.status(404).json({
      status: "error",
      message,
    });
  }

  static serverError(res, message = "Internal server error") {
    return res.status(500).json({
      status: "error",
      message,
    });
  }
}

module.exports = ApiResponse;
