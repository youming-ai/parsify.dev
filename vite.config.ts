import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vinext()],
  // Enable RSC for App Router (auto-registers @vitejs/plugin-rsc)
  ssr: {
    noExternal: ['@phosphor-icons/react', 'next-themes'],
  },
});
