import * as esbuild from 'esbuild'
import pkg from './package.json' with { type: "json" };
import esb_pkg from './node_modules/esbuild/package.json' with { type: "json" };

const bannerText = `/**
 * ${pkg.name} v${pkg.version}
 * Bundled by esbuild v${esb_pkg.version}
 * Built on: ${new Date().toISOString()}
 */`;

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/index.esm.js',
  banner: {
    js: bannerText,
  },
});

console.info("Build complete!");