/**
 * AI integration module - MOCK
 * =========================================================
 * Placeholder cho các tính năng AI trong tương lai:
 *  - /api/ai/chat             Chatbot AI hỗ trợ khách hàng
 *  - /api/ai/recommendation   AI gợi ý sản phẩm
 *  - /api/ai/analytics        AI phân tích doanh thu
 *  - /api/ai/forecast         AI dự đoán tồn kho
 *
 * Hiện tại chỉ trả về dữ liệu mock. Khi tích hợp AI thật,
 * thay body của từng hàm bằng lời gọi tới model AI (OpenAI, ...).
 */

const mockDelay = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const aiService = {
  async chat({ message, userId }) {
    await sleep(mockDelay);
    return {
      reply:
        "Xin chào! Em là trợ lý ảo của cửa hàng Balo - Túi xách. (Bản demo - AI chưa được kích hoạt)",
      original: message,
      userId: userId ?? null,
    };
  },

  async recommendation({ userId, limit = 4 }) {
    await sleep(mockDelay);
    return {
      userId: userId ?? null,
      recommendedProducts: [
        { id: 1, name: "Balo laptop chống sốc 15.6 inch", reason: "Phổ biến" },
        { id: 2, name: "Balo du lịch 40L chống nước", reason: "Xu hướng" },
        { id: 3, name: "Túi xách nữ da bò cao cấp", reason: "Đánh giá tốt" },
        { id: 4, name: "Ví da bò nam mini", reason: "Giá tốt" },
      ].slice(0, limit),
    };
  },

  async analytics() {
    await sleep(mockDelay);
    return {
      summary: "Tổng doanh thu dự kiến đạt mục tiêu quý này.",
      insights: [
        "Doanh thu tăng trưởng 12% so với tháng trước.",
        "Danh mục Balo laptop chiếm 35% doanh thu.",
        "Khách hàng mới tăng 18% trong 30 ngày qua.",
      ],
    };
  },

  async forecast({ productId }) {
    await sleep(mockDelay);
    return {
      productId: productId ?? null,
      forecast: [
        { month: "Tháng sau", predictedSales: 120 },
        { month: "2 tháng sau", predictedSales: 145 },
        { month: "3 tháng sau", predictedSales: 130 },
      ],
      note: "Dữ liệu dự báo là mock, chưa phải output của model AI.",
    };
  },
};