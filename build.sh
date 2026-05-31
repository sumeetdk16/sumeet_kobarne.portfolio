#!/bin/bash
set -e

# 1. Bundle shader.js with all its npm dependencies into a self-contained IIFE
npx vite build

# 2. Copy all static files into dist
cp index.html about.html projects.html style.css dist/

# Copy every JS file in the root (except vite config / node scripts)
for f in *.js; do
  case "$f" in
    vite.config.js) ;;          # skip vite config
    *) cp "$f" dist/ ;;
  esac
done

cp resume.pdf dist/ 2>/dev/null || true
cp profile.jpg dist/ 2>/dev/null || true
cp avatar-favicon.png dist/ 2>/dev/null || true
cp download.png dist/ 2>/dev/null || true
cp robots.txt dist/ 2>/dev/null || true
cp sitemap.xml dist/ 2>/dev/null || true
cp -r fonts dist/ 2>/dev/null || true

# 3. Swap module shader import → bundled IIFE in all HTML files
# Use perl for cross-platform compatibility (works on both macOS and Linux/Vercel)
perl -i -pe 's|<script type="module" src="shader\.js"></script>|<script src="shader.bundle.iife.js"></script>|g' \
  dist/index.html dist/about.html dist/projects.html

# 4. typewriter.js doesn't need to be a module either
perl -i -pe 's|<script type="module" src="typewriter\.js"></script>|<script src="typewriter.js"></script>|g' \
  dist/index.html

echo "Build complete — dist/ is ready"
