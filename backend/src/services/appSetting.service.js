import { appSettingRepository } from "../repositories/appSetting.repository.js";
import { ApiError } from "../utils/ApiError.js";

// Danh sách khóa cài đặt được phép chỉnh (chặn ghi khóa lạ)
export const ALLOWED_SETTING_KEYS = ["support_hotline", "support_zalo", "support_email"];

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.key, r.value]));

export const appSettingService = {
  async getPublic() {
    const rows = await appSettingRepository.findMany({ where: { isSecret: false } });
    return toMap(rows);
  },

  async update({ settings }) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new ApiError(400, "Cần gửi object settings");
    }

    for (const key of Object.keys(settings)) {
      if (!ALLOWED_SETTING_KEYS.includes(key)) {
        throw new ApiError(400, `Khóa cài đặt không hợp lệ: ${key}`);
      }
    }

    for (const key of ALLOWED_SETTING_KEYS) {
      if (!(key in settings)) continue;
      const raw = settings[key];
      const value = raw == null || String(raw).trim() === "" ? null : String(raw).trim();
      await appSettingRepository.upsert(key, value);
    }

    return this.getPublic();
  },
};