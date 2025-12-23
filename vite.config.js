import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        // Bypass route quotation khỏi proxy để React Router xử lý
        bypass: (req) => {
          // Nếu là route quotation, không proxy (trả về undefined)
          // React Router sẽ xử lý route này
          if (req.url?.match(/^\/api\/service-tickets\/\d+\/quotation/)) {
            return undefined; // Không proxy, để React Router xử lý
          }
        },
      },
      "/ws": {
        target: "http://localhost:8080",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      format: {
        comments: false,
      },
    },
    cssCodeSplit: true,
    cssMinify: true,
    sourcemap: false,
    target: "es2015",
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "react-is"],
    force: true,
  },
  css: {
    devSourcemap: false,
  },
});
