// src/utils/dateUtils.js
/**
 * Format datetime sang dạng thân thiện cho email
 * Ví dụ: 25/12/2025 lúc 10:32 (GMT+7)
 */
exports.formatEmailDateTime = (date = new Date()) => {
  const d = new Date(date);

  const datePart = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} lúc ${timePart}`;
};
