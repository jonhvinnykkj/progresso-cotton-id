import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to get all dependencies
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
const allDependencies = Object.keys(pkg.dependencies || {});

async function buildServer() {
  try {
    await build({
      entryPoints: [join(__dirname, 'server', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: join(__dirname, 'dist', 'index.js'),
      // Mark all dependencies as external - don't bundle them
      external: allDependencies,
      // This tells esbuild to treat all node_modules as external
      packages: 'external',
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
