import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwind from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
    plugins: [react(), tailwind()],
    server: {
        port: 3000, // Giữ lại nếu bạn muốn chạy ở cổng 3000
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
