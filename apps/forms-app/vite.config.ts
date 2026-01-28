import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()  // Bundle everything into a single HTML file for MCP Apps
  ],
  root: './src/ui',
  build: {
    outDir: '../../dist/ui',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/ui/index.html')
    }
  },
});
