import { successResponse } from "../utils/ApiResponse.js";
import { uploadsUrlPrefix } from "../config/upload.js";

export const uploadController = {
  uploadImage: (req, res) => {
    const url = `${uploadsUrlPrefix}/${req.file.filename}`;
    return successResponse(res, 200, "Upload ảnh thành công", {
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  },
};