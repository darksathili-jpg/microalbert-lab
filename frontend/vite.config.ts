import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le point d'entrée public est choisi explicitement par le workflow
// (index-public.html -> index.html), jamais par une transformation tardive.
export default defineConfig(({mode})=>({
  base: mode==='public-demo' ? '/microalbert-lab/' : '/',
  plugins: [react()],
  server: { host: '127.0.0.1', proxy: { '/api': 'http://127.0.0.1:8000' } },
}));
