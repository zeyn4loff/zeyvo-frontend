import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
import tailwindcss from "@tailwindcss/vite";
import {fileURLToPath, URL} from "node:url";

// https://vite.dev/config/
export default defineConfig({
    server: {
        proxy: {
            '/api': { target: 'https://zeyvo.test', changeOrigin: true, secure: false },
            '/storage': { target: 'https://zeyvo.test', changeOrigin: true, secure: false },
        },
    },
    plugins: [react(),
        tailwindcss(),],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
})
