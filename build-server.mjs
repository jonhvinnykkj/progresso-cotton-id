import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildServer() {
  try {
    await build({
      entryPoints: [join(__dirname, 'server', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: join(__dirname, 'dist', 'index.js'),
      external: [
        '@neondatabase/serverless',
        'drizzle-orm',
        'express',
        'ws',
        'pg',
        'xlsx',
        'jspdf',
        'jspdf-autotable',
        'qrcode',
        'date-fns',
        'zod'
      ],
      sourcemap: true,
      logLevel: 'info',
    });
    
    console.log('✅ Server build completed!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildServer();
