#!/usr/bin/env node
/**
 * Pre-process Tailwind v4 CSS before Angular build.
 * Angular 22's @angular/build:application does NOT run PostCSS,
 * so @theme{...} and @import "tailwindcss" remain unprocessed.
 * This script generates fully compiled standard CSS.
 */
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const fs = require('fs');
const path = require('path');

async function build(cssPath) {
  const absPath = path.resolve(cssPath);
  const source = fs.readFileSync(absPath, 'utf8');
  
  console.log(`Processing: ${cssPath} (${(source.length/1024).toFixed(1)}KB source)`);
  
  const result = await postcss([tailwindcss()]).process(source, {
    from: absPath,
  });
  
  fs.writeFileSync(absPath, result.css, 'utf8');
  
  const sizeKB = (result.css.length / 1024).toFixed(1);
  console.log(`Done: ${sizeKB}KB written`);
  
  // Verify
  const hasAtTheme = result.css.includes('@theme');
  const hasFlex = result.css.includes('.flex');
  const hasColonRoot = result.css.includes(':root') || result.css.includes('--color-primary-500');
  
  console.log(`  @theme remaining: ${hasAtTheme ? '❌' : '✅'}`);
  console.log(`  Utility classes: ${hasFlex ? '✅ (.flex found)' : '❌'}`);
  console.log(`  CSS variables: ${hasColonRoot ? '✅' : '❌'}`);
  
  if (hasAtTheme) {
    console.error('ERROR: @theme still present in output!');
    process.exit(1);
  }
  if (!hasFlex) {
    console.warn('WARNING: No utility classes (.flex) found - templates may not be scanned');
  }
  
  return result.css;
}

const cssFile = process.argv[2];
if (!cssFile) {
  console.error('Usage: node build-css.js <path/to/styles.css>');
  process.exit(1);
}

build(cssFile).catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
