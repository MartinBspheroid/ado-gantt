import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to rewrite /dist/gantt.html to /index.html for Azure DevOps extension dev
const azureDevOpsRedirect = () => ({
  name: 'azure-devops-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/dist/gantt.html' || req.url?.startsWith('/dist/gantt.html?')) {
        req.url = '/index.html';
      }
      next();
    });
  }
});

export default defineConfig({
  // Base path for serving assets - needed for Azure DevOps extension which expects /dist/
  base: '/dist/',
  plugins: [
    react({
      // Use classic JSX transform to avoid jsx-runtime ordering issues
      jsxRuntime: 'classic'
    }),
    basicSsl(),
    azureDevOpsRedirect()
  ],
  resolve: {
    alias: {
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components')
    },
    // Dedupe React to prevent multiple instances
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    // basicSsl plugin handles HTTPS
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  // Serve root index.html for /dist/gantt.html requests (Azure DevOps extension path)
  appType: 'spa',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    // Don't empty outDir to preserve gantt.html
    emptyOutDir: false,
    // CSS in JS to avoid separate file
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        gantt: path.resolve(__dirname, 'src/index.tsx')
      },
      output: {
        // Use UMD format for better compatibility
        format: 'umd',
        name: 'GanttExtension',
        // Single file output
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        // Inline all chunks into main bundle
        inlineDynamicImports: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});