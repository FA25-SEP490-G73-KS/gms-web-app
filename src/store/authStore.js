import { create } from "zustand";
import { authAPI } from "../services/api";
import { normalizePhoneTo0, decodeJWT, normalizeRole } from "../utils/helpers";

// Initialize user from refreshToken if available (on page reload)
const initializeUser = async () => {
  try {
    if (typeof window === "undefined") return null;

    // Lấy refreshToken từ localStorage (rememberMe = true) hoặc sessionStorage (rememberMe = false)
    // Ưu tiên localStorage trước
    const refreshTokenFromLocal = localStorage.getItem("refreshToken");
    const refreshTokenFromSession = sessionStorage.getItem("refreshToken");
    const refreshToken = refreshTokenFromLocal || refreshTokenFromSession;
    const isFromLocalStorage = !!refreshTokenFromLocal;

    console.log(
      "[AuthStore] initializeUser - refreshToken exists:",
      !!refreshToken,
      "from localStorage:",
      isFromLocalStorage,
      "from sessionStorage:",
      !!refreshTokenFromSession
    );

    if (refreshToken) {
      try {
        console.log("[AuthStore] Attempting to refresh token...");
        // Thử refresh token để lấy accessToken mới
        const { data: response, error } = await authAPI.refreshToken(
          refreshToken
        );
        console.log("[AuthStore] Refresh token response:", {
          hasError: !!error,
          hasAccessToken: !!response?.result?.accessToken,
          statusCode: response?.statusCode,
          errorMessage: error,
          responseData: response,
        });

        if (!error && response?.result?.accessToken) {
          const accessToken = response.result.accessToken;
          const decoded = decodeJWT(accessToken);
          if (decoded) {
            const rawRole =
              decoded?.role ||
              decoded?.userRole ||
              decoded?.authorities?.[0] ||
              decoded?.authority;
            if (rawRole) {
              const normalizedRole = normalizeRole(rawRole);
              console.log(
                "[AuthStore] Token refreshed successfully, role:",
                normalizedRole
              );
              const newRefreshToken =
                response.result.refreshToken || refreshToken;

              // Lưu refreshToken mới vào đúng storage (localStorage hoặc sessionStorage)
              if (isFromLocalStorage) {
                localStorage.setItem("refreshToken", newRefreshToken);
              } else {
                sessionStorage.setItem("refreshToken", newRefreshToken);
              }

              return {
                accessToken, // Lưu trong memory
                refreshToken: newRefreshToken, // Cập nhật refreshToken mới
                user: {
                  id: decoded?.userId || decoded?.id || decoded?.sub || null,
                  role: normalizedRole,
                  fullName:
                    decoded?.fullName ||
                    decoded?.name ||
                    decoded?.username ||
                    null,
                  email: decoded?.email || null,
                  phone: decoded?.phone || null,
                },
              };
            } else {
              console.warn(
                "[AuthStore] Token decoded but no role found in token"
              );
            }
          } else {
            console.warn("[AuthStore] Failed to decode access token");
          }
        } else {
          // Refresh token không hợp lệ hoặc có lỗi từ server
          console.error("[AuthStore] Refresh token failed:", {
            error,
            statusCode: response?.statusCode,
            message: response?.message || error,
          });

          // Chỉ xóa refreshToken khi chắc chắn nó không hợp lệ (401, 403)
          // Không xóa khi là lỗi server (500) hoặc network error
          const statusCode = response?.statusCode;
          if (statusCode === 401 || statusCode === 403) {
            // RefreshToken không hợp lệ hoặc đã hết hạn, xóa từ cả localStorage và sessionStorage
            console.log(
              "[AuthStore] Refresh token invalid (401/403), removing from storage"
            );
            localStorage.removeItem("refreshToken");
            sessionStorage.removeItem("refreshToken");
          } else {
            // Lỗi server (500) hoặc network error - giữ refreshToken để retry sau
            console.warn(
              "[AuthStore] Server/network error during refresh, keeping refreshToken for retry. Status:",
              statusCode
            );
            // Không xóa refreshToken, để có thể retry sau
          }
          return null;
        }
      } catch (err) {
        console.error("[AuthStore] Exception during token refresh:", err);
        // Lỗi network hoặc exception khác - KHÔNG xóa refreshToken
        // Có thể là lỗi tạm thời, giữ refreshToken để retry sau
        // Chỉ return null để không set user, nhưng vẫn giữ refreshToken
        return null;
      }
    } else {
      console.log(
        "[AuthStore] No refreshToken found in localStorage or sessionStorage"
      );
    }
  } catch (error) {
    console.error("[AuthStore] Error initializing user:", error);
  }
  return null;
};

const useAuthStore = create((set, get) => ({
  // accessToken lưu trong memory (state)
  accessToken: null,
  // refreshToken lưu trong localStorage (rememberMe = true) hoặc sessionStorage (rememberMe = false)
  refreshToken:
    typeof window !== "undefined"
      ? localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken")
      : null,
  user: null,
  loading: false,
  isRefreshing: false, // Flag để tránh multiple refresh requests
  isLoggingOut: false, // Flag để tránh multiple logout requests

  // Initialize store on mount (for page reload)
  initialize: async () => {
    console.log("[AuthStore] initialize() called");
    const initialized = await initializeUser();
    if (initialized) {
      console.log(
        "[AuthStore] User initialized successfully:",
        initialized.user
      );
      // Cập nhật refreshToken trong localStorage nếu có refreshToken mới
      if (initialized.refreshToken && typeof window !== "undefined") {
        localStorage.setItem("refreshToken", initialized.refreshToken);
      }
      set({
        accessToken: initialized.accessToken,
        refreshToken: initialized.refreshToken,
        user: initialized.user,
      });
      console.log(
        "[AuthStore] State updated with user:",
        initialized.user?.role
      );
    } else {
      console.log(
        "[AuthStore] No user initialized (no refreshToken or refresh failed)"
      );
    }
  },

  login: async (phone, password, rememberMe = false) => {
    const normalizedPhone = normalizePhoneTo0(phone);
    set({ loading: true });
    try {
      const { data: response, error } = await authAPI.login(
        normalizedPhone,
        password,
        rememberMe
      );

      if (error) {
        set({ loading: false });
        throw new Error(error);
      }

      if (
        !response ||
        (response.statusCode !== 200 && response.statusCode !== 201)
      ) {
        set({ loading: false });
        throw new Error(response?.message || "Đăng nhập thất bại");
      }

      const result = response.result || response;
      const accessToken = result?.accessToken;
      const refreshToken = result?.refreshToken;

      if (!accessToken) {
        set({ loading: false });
        throw new Error("Không nhận được access token từ server");
      }

      // Decode accessToken để lấy thông tin user
      const decoded = decodeJWT(accessToken);
      if (!decoded) {
        set({ loading: false });
        throw new Error("Không thể decode access token");
      }

      // Lấy role từ token
      let userRole = null;
      const rawRole =
        decoded?.role ||
        decoded?.userRole ||
        decoded?.authorities?.[0] ||
        decoded?.authority;
      if (rawRole) {
        userRole = normalizeRole(rawRole);
      }

      // Nếu không có role từ token, thử lấy từ response
      if (!userRole) {
        const rawRoleFromResponse =
          result?.role || result?.userRole || result?.user?.role;
        userRole = rawRoleFromResponse
          ? normalizeRole(rawRoleFromResponse)
          : null;
      }

      const userData = result?.user || {
        id: decoded?.userId || decoded?.id || decoded?.sub || null,
        phone: decoded?.phone || normalizedPhone,
        role: userRole,
        fullName:
          decoded?.fullName ||
          decoded?.name ||
          decoded?.username ||
          result?.fullName ||
          result?.name ||
          "",
        email: decoded?.email || result?.email || "",
      };

      // Normalize role nếu chưa được normalize
      if (userData.role && !userRole) {
        userData.role = normalizeRole(userData.role);
      } else if (!userData.role && userRole) {
        userData.role = userRole;
      }

      // Lưu refreshToken vào localStorage (rememberMe = true) hoặc sessionStorage (rememberMe = false)
      if (refreshToken && typeof window !== "undefined") {
        if (rememberMe) {
          // Lưu vào localStorage - sẽ giữ khi đóng tab
          localStorage.setItem("refreshToken", refreshToken);
          sessionStorage.removeItem("refreshToken"); // Xóa sessionStorage nếu có
          console.log(
            "[AuthStore] RefreshToken saved to localStorage (rememberMe=true)"
          );
        } else {
          // Lưu vào sessionStorage - sẽ tự xóa khi đóng tab
          sessionStorage.setItem("refreshToken", refreshToken);
          localStorage.removeItem("refreshToken"); // Xóa localStorage nếu có
          console.log(
            "[AuthStore] RefreshToken saved to sessionStorage (rememberMe=false)"
          );
        }
      }

      // Lưu accessToken trong memory (state), KHÔNG lưu vào storage
      set({
        accessToken: accessToken,
        refreshToken: rememberMe && refreshToken ? refreshToken : null,
        user: userData,
        loading: false,
      });

      return response;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Refresh accessToken bằng refreshToken
  refreshAccessToken: async () => {
    const state = get();

    // Nếu đang refresh, không refresh lại
    if (state.isRefreshing) {
      return state.accessToken;
    }

    // Nếu không có refreshToken, không thể refresh
    // Lấy từ cả localStorage và sessionStorage
    const refreshTokenFromLocal =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;
    const refreshTokenFromSession =
      typeof window !== "undefined"
        ? sessionStorage.getItem("refreshToken")
        : null;
    const refreshToken =
      state.refreshToken || refreshTokenFromLocal || refreshTokenFromSession;
    const isFromLocalStorage = !!refreshTokenFromLocal;

    if (!refreshToken) {
      return null;
    }

    set({ isRefreshing: true });

    try {
      const { data: response, error } = await authAPI.refreshToken(
        refreshToken
      );

      if (error || !response?.result?.accessToken) {
        // Refresh token không hợp lệ, xóa từ cả localStorage và sessionStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("refreshToken");
          sessionStorage.removeItem("refreshToken");
        }
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isRefreshing: false,
        });
        return null;
      }

      const newAccessToken = response.result.accessToken;
      const newRefreshToken = response.result.refreshToken;

      // Decode để cập nhật user info
      const decoded = decodeJWT(newAccessToken);
      if (decoded) {
        const rawRole =
          decoded?.role ||
          decoded?.userRole ||
          decoded?.authorities?.[0] ||
          decoded?.authority;
        if (rawRole) {
          const normalizedRole = normalizeRole(rawRole);
          const userData = {
            id:
              decoded?.userId ||
              decoded?.id ||
              decoded?.sub ||
              state.user?.id ||
              null,
            role: normalizedRole,
            fullName:
              decoded?.fullName ||
              decoded?.name ||
              decoded?.username ||
              state.user?.fullName ||
              null,
            email: decoded?.email || state.user?.email || null,
            phone: decoded?.phone || state.user?.phone || null,
          };

          // Cập nhật refreshToken vào đúng storage (localStorage hoặc sessionStorage)
          if (newRefreshToken && typeof window !== "undefined") {
            if (isFromLocalStorage) {
              localStorage.setItem("refreshToken", newRefreshToken);
            } else {
              sessionStorage.setItem("refreshToken", newRefreshToken);
            }
          }

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || state.refreshToken,
            user: userData,
            isRefreshing: false,
          });

          return newAccessToken;
        }
      }

      // Nếu không decode được, vẫn cập nhật accessToken
      set({
        accessToken: newAccessToken,
        isRefreshing: false,
      });

      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Xóa refreshToken từ cả localStorage và sessionStorage nếu refresh thất bại
      if (typeof window !== "undefined") {
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
      }
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isRefreshing: false,
      });
      return null;
    }
  },

  logout: async () => {
    const state = get();

    // Tránh gọi logout nhiều lần liên tiếp (tránh vòng lặp)
    if (state.isLoggingOut) {
      return;
    }

    set({ isLoggingOut: true });

    try {
      // Chỉ gọi API logout nếu có token (tránh vòng lặp khi chưa đăng nhập)
      const accessToken = state.accessToken;
      const refreshTokenFromLocal =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;
      const refreshTokenFromSession =
        typeof window !== "undefined"
          ? sessionStorage.getItem("refreshToken")
          : null;
      const refreshToken =
        state.refreshToken || refreshTokenFromLocal || refreshTokenFromSession;

      if (accessToken || refreshToken) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      try {
        const wsStore = (await import("./websocketStore")).default;
        wsStore.getState().disconnect();
      } catch (wsError) {
        console.error("Error disconnecting WebSocket:", wsError);
      }

      // Xóa tất cả token khỏi memory và storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("user");
      }

      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isLoggingOut: false,
      });
    }
  },

  setUser: (user) => set({ user }),

  // Getter để lấy accessToken từ store
  getAccessToken: () => get().accessToken,
}));

export default useAuthStore;
