import ResetPassword from "../components/auth/ResetPassword";

export function meta() {
  return [
    { title: "GMS • Đặt lại mật khẩu" },
    { name: "description", content: "Đặt lại mật khẩu • Garage Hoàng Tuấn" },
  ];
}

export default function ResetPasswordRoute() {
  return <ResetPassword />;
}
