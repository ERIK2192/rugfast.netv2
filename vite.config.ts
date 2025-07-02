
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Fix all rpc-websockets import paths by mapping them to the main package entry
      "rpc-websockets/dist/lib/client": "rpc-websockets",
      "rpc-websockets/dist/lib/client/websocket.browser": "rpc-websockets",
      "rpc-websockets/dist/lib/client/websocket": "rpc-websockets",
      "rpc-websockets/websocket.browser": "rpc-websockets",
      "rpc-websockets/browser": "rpc-websockets",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'solana-web3': ['@solana/web3.js'],
          'solana-wallet': ['@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui', '@solana/wallet-adapter-wallets'],
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@solana/web3.js', '@solana/wallet-adapter-react'],
    exclude: ['rpc-websockets'],
  }
}));
