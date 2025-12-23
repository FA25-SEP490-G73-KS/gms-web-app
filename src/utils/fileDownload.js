import axios from "axios";
import { message } from "antd";

/**
 * Download file với authentication và error handling chuẩn production
 * @param {string} fileUrl - URL của file (có thể là relative hoặc absolute)
 * @param {string} fileName - Tên file khi download (optional)
 * @param {object} options - Options bổ sung
 */
export const downloadFile = async (fileUrl, fileName = null, options = {}) => {
  try {
    // Validate input
    if (!fileUrl) {
      message.error("URL file không hợp lệ");
      return false;
    }

    // Lấy token từ storage
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    // Build full URL nếu là relative path
    let fullUrl = fileUrl;
    if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
      const baseURL =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");
      const cleanBaseURL = baseURL.replace("/api", "");
      fullUrl = `${cleanBaseURL}${
        fileUrl.startsWith("/") ? "" : "/"
      }${fileUrl}`;
    }

    // Fetch file với authentication
    const response = await axios.get(fullUrl, {
      responseType: "blob",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        ...options.headers,
      },
      timeout: options.timeout || 30000, // 30 seconds timeout
      onDownloadProgress: options.onProgress || undefined,
    });

    // Validate response
    if (!response.data || response.data.size === 0) {
      message.error("File rỗng hoặc không tồn tại");
      return false;
    }

    // Kiểm tra xem có phải là error response không
    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      const text = await new Response(response.data).text();
      try {
        const errorData = JSON.parse(text);
        message.error(
          errorData.message || errorData.error || "Không thể tải file"
        );
        return false;
      } catch (e) {
        message.error("Không thể tải file. Vui lòng thử lại.");
        return false;
      }
    }

    // Xác định MIME type và file name
    const detectedFileName =
      fileName ||
      getFileNameFromUrl(fullUrl) ||
      getFileNameFromHeaders(response.headers) ||
      "download";

    const mimeType = getMimeType(contentType, detectedFileName);

    // Tạo blob với đúng MIME type
    const blob = new Blob([response.data], { type: mimeType });

    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = detectedFileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error("Error downloading file:", error);

    // Xử lý các loại lỗi khác nhau
    if (error.response) {
      // Server trả về error response
      if (error.response.data instanceof Blob) {
        try {
          const text = await new Response(error.response.data).text();
          const errorData = JSON.parse(text);
          message.error(
            errorData.message || errorData.error || "Không thể tải file"
          );
        } catch (e) {
          if (error.response.status === 404) {
            message.error("File không tồn tại hoặc đã bị xóa");
          } else if (error.response.status === 403) {
            message.error("Bạn không có quyền truy cập file này");
          } else if (error.response.status === 401) {
            message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
          } else {
            message.error(`Lỗi ${error.response.status}: Không thể tải file`);
          }
        }
      } else {
        message.error(error.response.data?.message || "Không thể tải file");
      }
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      message.error(
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng"
      );
    } else {
      // Lỗi khi setup request
      message.error(error.message || "Đã xảy ra lỗi khi tải file");
    }

    return false;
  }
};

/**
 * Lấy tên file từ URL
 */
const getFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split("/").pop() || null;
  } catch (e) {
    // Nếu không parse được URL, thử split thủ công
    return url.split("/").pop().split("?")[0] || null;
  }
};

/**
 * Lấy tên file từ Content-Disposition header
 */
const getFileNameFromHeaders = (headers) => {
  const contentDisposition = headers["content-disposition"];
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    );
    if (fileNameMatch && fileNameMatch[1]) {
      return fileNameMatch[1].replace(/['"]/g, "");
    }
  }
  return null;
};

/**
 * Xác định MIME type từ Content-Type hoặc file extension
 */
const getMimeType = (contentType, fileName) => {
  // Nếu đã có Content-Type hợp lệ, dùng nó
  if (contentType && !contentType.includes("application/octet-stream")) {
    return contentType.split(";")[0].trim();
  }

  // Xác định từ extension
  const extension = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    txt: "text/plain",
    csv: "text/csv",
  };

  return mimeTypes[extension] || "application/octet-stream";
};
