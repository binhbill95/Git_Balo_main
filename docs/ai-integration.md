# AI Integration (Tương lai)

Module AI đã được chuẩn bị sẵn sàng trong dự án tại `backend/src/modules/ai/`. Hiện tại trả về **dữ liệu mock** — khi có model AI thật, chỉ cần sửa phần thân hàm trong `ai.service.js`.

## Endpoint đã có sẵn

| Endpoint | Chức năng | Trạng thái |
|---|---|---|
| `POST /api/v1/ai/chat` | Chatbot AI hỗ trợ khách hàng | Mock |
| `GET /api/v1/ai/recommendation` | AI gợi ý sản phẩm | Mock |
| `GET /api/v1/ai/analytics` | AI phân tích doanh thu | Mock |
| `GET /api/v1/ai/forecast` | AI dự đoán tồn kho | Mock |

## Cấu trúc module

```
backend/src/modules/ai/
├── ai.routes.js      # Định tuyến (đã mount sẵn vào app)
├── ai.controller.js  # Nhận request, trả response
└── ai.service.js     # MOCK - nơi sẽ gọi model AI thật
```

## Cách tích hợp AI thật

1. **Giữ nguyên routes + controllers** — không đổi giao diện API cho client.
2. Thay body hàm trong `ai.service.js`:

```js
export const aiService = {
  async chat({ message, userId }) {
    // Gọi OpenAI / model tùy chọn, truyền thêm lịch sử + context sản phẩm
    const completion = await openai.chat.completions.create({ ... });
    return { reply: completion.choices[0].message.content };
  },

  async recommendation({ userId, limit = 4 }) {
    // Dùng embedding / collaborative filtering từ data orders, inventory_logs
    return { recommendedProducts: [...] };
  },

  async analytics() {
    // Gọi model phân tích chuỗi doanh thu, đưa ra insight
    return { summary: "...", insights: [...] };
  },

  async forecast({ productId }) {
    // Dùng time-series prediction (fbprophet) trên order_items, stock_logs
    return { productId, forecast: [...], confidence: 0.9 };
  },
};
```

3. Thêm biến môi trường như `OPENAI_API_KEY` vào `.env` và `config/env.js`.

Mọi endpoint đã được bảo vệ bằng middleware `authenticate` nên client phải đăng nhập trước khi dùng AI.