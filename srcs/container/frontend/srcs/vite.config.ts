import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(),tailwindcss()],
	build: {
		outDir: '/var/www/html/frontend',
	},
	server: {
		hmr: {
			protocol: 'wss',
			host: 'localhost',
			port: 3000,
		},
		allowedHosts: true,
	}
});