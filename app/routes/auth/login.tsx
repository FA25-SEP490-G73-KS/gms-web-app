// Route: /auth/login — renders the Login screen.
import type { Route } from "../+types/login";
import AuthLayout from "../../layouts/AuthLayout";
import LoginPage from "../../pages/auth/Login";

export function meta({}: Route.MetaArgs) {
  return [{ title: "GMS • Login" }];
}

export default function AuthLoginRoute() {
  return (
    <AuthLayout title="Login">
      <LoginPage />
    </AuthLayout>
  );
}
