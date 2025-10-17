// constants.ts: App-wide constants (roles, routes, etc.).

export const ROLES = {
  MANAGER: "Manager",
  SERVICE_ADVISOR: "ServiceAdvisor",
  ACCOUNTANT: "Accountant",
  WAREHOUSE: "Warehouse",
  CUSTOMER: "Customer",
} as const;

export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/login",
    CREATE_PASSWORD: "/auth/create-password",
    FORGET_PASSWORD: "/auth/forget-password",
    VERIFY_OTP: "/auth/verify-otp",
    CHANGE_PASSWORD: "/auth/change-password",
  },
} as const;
