// AuthLayout: Minimal layout for authentication-related pages.
import * as React from "react";

export default function AuthLayout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        {title && <h1 className="text-xl font-semibold mb-2">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
