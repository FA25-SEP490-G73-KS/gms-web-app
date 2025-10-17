// MainLayout: Common app shell (header/nav/footer) for authenticated areas.
import * as React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* TODO: Add shared header / sidebar */}
      <main className="container mx-auto px-4 py-6">{children}</main>
      {/* TODO: Add shared footer */}
    </div>
  );
}
