import ResetSuccess from "../components/auth/ResetSuccess";

export function meta() {
  return [
    { title: "GMS • Thay đổi mật khẩu thành công" },
    { name: "description", content: "Thay đổi mật khẩu thành công • Garage Hoàng Tuấn" },
  ];
}

export default function ResetSuccessRoute() {
  return <ResetSuccess />;
}
