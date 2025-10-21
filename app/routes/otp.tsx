import Otp from "../components/auth/Otp";

export function meta() {
  return [
    { title: "GMS • Nhập mã OTP" },
    { name: "description", content: "Nhập mã OTP • Garage Hoàng Tuấn" },
  ];
}

export default function OtpRoute() {
  return <Otp />;
}
