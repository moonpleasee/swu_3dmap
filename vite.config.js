import { defineConfig } from 'vite';
export default defineConfig({ base: './', server: {proxy:Object.fromEntries(['/api','/media','/admin'].map(p=>[p,'http://127.0.0.1:4311']))}, build: { chunkSizeWarningLimit: 650 } });
