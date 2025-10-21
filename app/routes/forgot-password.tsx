import ForgotPassword from "../components/auth/ForgotPassword";
import AuthLayout from "../layouts/AuthLayout";

export function meta() {
  return [
    { title: "GMS • Quên mật khẩu" },
    { name: "description", content: "Quên mật khẩu • Garage Hoàng Tuấn" },
  ];
}

export default function ForgotPasswordRoute() {
  return (
      <ForgotPassword />
  );
}
