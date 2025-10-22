import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/appointments", "routes/appointments.tsx"),
  route("/service-tickets", "routes/service-tickets.tsx"),
  route("/service-tickets-new", "routes/service-tickets.new.tsx"),
] satisfies RouteConfig;
