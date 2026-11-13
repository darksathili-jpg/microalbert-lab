import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function publicEntry(): Plugin {
 return {
  name: 'microalbert-public-entry',
  transformIndexHtml(html) {
   return html.replace('/src/main.tsx','/src/main-public.tsx');
  }
 };
}

export default defineConfig(({mode})=>({
  base: mode==='public-demo' ? '/microalbert-lab/' : '/',
  plugins: [react(), ...(mode==='public-demo' ? [publicEntry()] : [])],
  server: { host: '127.0.0.1', proxy: { '/api': 'http://127.0.0.1:8000' } },
}));
