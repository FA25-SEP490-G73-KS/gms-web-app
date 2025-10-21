import type { Route } from "./+types/login";
import Login from "../components/auth/Login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GMS • Đăng nhập" },
    { name: "description", content: "Đăng nhập • Garage Hoàng Tuấn" },
  ];
}

export default function LoginRoute() {
  return <Login />;
}
