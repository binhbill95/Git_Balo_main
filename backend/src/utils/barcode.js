// Sinh & xử lý mã vạch EAN-13
const computeCheckDigit = (digits) => {
  const s = String(digits).replace(/\D/g, "");
  if (s.length !== 12) {
    throw new Error("EAN-13 cần đúng 12 chữ số (chưa kể số kiểm tra)");
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(s[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return s + ((10 - (sum % 10)) % 10);
};

// EAN-13 có đủ 13 chữ số và số kiểm tra hợp lệ?
export const isValidEan13 = (value) => {
  const s = String(value).replace(/\D/g, "");
  if (s.length !== 13) return false;
  const check = Number(s[12]);
  const computed = computeCheckDigit(s.slice(0, 12));
  return computed[12] === String(check);
};

// Sinh EAN-13 dựa trên một số nền 12 chữ số
export const makeEan13 = (base12) => computeCheckDigit(base12);

// Sinh EAN-13 ổn định theo product id (890 + 9 chữ số + check digit)
export const ean13FromId = (id) => {
  const base12 = String(Number(id) + 890000000000);
  return computeCheckDigit(base12.slice(0, 12));
};