// Build lapisan animasi JSX -> static/animations.bundle.js
//   npm install        (sekali saja)
//   npm run build      (sekali build)
//   npm run dev        (watch saat mengedit src/)
import { build, context } from "esbuild";

const options = {
  entryPoints: ["src/main.jsx"],
  outfile: "static/animations.bundle.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching src/ ...");
} else {
  await build(options);
}
