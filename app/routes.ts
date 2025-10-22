import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/appointments", "routes/appointments.tsx"),
  route("/service-tickets", "routes/service-tickets.tsx"),
  route("/service-tickets-new", "routes/service-tickets.new.tsx"),
    route("/login", "routes/login.tsx"),
    route("/forgot-password", "routes/forgot-password.tsx"),
    route("/otp", "routes/otp.tsx"),
    route("/reset-password", "routes/reset-password.tsx"),
    route("/reset-success", "routes/reset-success.tsx"),

] satisfies RouteConfig;
