const esbuild = require('esbuild');
const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const isWatchMode = process.argv.includes('--watch');

// Make sure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist');
}

const { dirname } = require('path'); // Add path module

// Helper function to ensure directory exists
const ensureDirSync = (dirPath) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// Copy static files
const copyStaticFiles = () => {
  try {
    // Copy manifest
    copyFileSync('./src/manifest.json', './dist/manifest.json');

    // Copy HTML files to their respective subdirectories
    const popupDest = './dist/ui/popup/index.html';
    const optionsDest = './dist/ui/options/index.html';
    ensureDirSync(dirname(popupDest));
    ensureDirSync(dirname(optionsDest));
    copyFileSync('./src/ui/popup/index.html', popupDest);
    copyFileSync('./src/ui/options/index.html', optionsDest);
    
    // Copy assets directory if it exists
    if (existsSync('./src/assets')) {
      if (!existsSync('./dist/assets')) {
        mkdirSync('./dist/assets');
      }
      
      // Copy images
      if (existsSync('./src/assets/images')) {
        if (!existsSync('./dist/assets/images')) {
          mkdirSync('./dist/assets/images');
        }
        
        // Copy character images
        ['zundamon.png', 'shikoku_metan.png'].forEach(img => {
          if (existsSync(`./src/assets/images/${img}`)) {
            copyFileSync(`./src/assets/images/${img}`, `./dist/assets/images/${img}`);
          }
        });
      }
      
      // No icon copying needed
    }
    
    console.log('Static files copied successfully');
  } catch (err) {
    console.error('Error copying static files:', err);
  }
};

// Build configuration
const buildOptions = {
  entryPoints: [
    'src/background.ts',
    'src/content.ts',
    'src/ui/popup/index.tsx', // Changed from popup.ts
    'src/ui/options/index.tsx' // Changed from options.ts
  ],
  bundle: true,
  jsxFactory: 'h', // Added for Preact
  jsxFragment: 'Fragment', // Added for Preact
  minify: !isWatchMode,
  sourcemap: isWatchMode ? 'inline' : false,
  target: ['chrome89'],
  outdir: 'dist',
  format: 'esm',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'file',
    '.css': 'text'
  },
  alias: { // Added for Preact compatibility
    'react': 'preact/compat',
    'react-dom/test-utils': 'preact/test-utils',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime'
  },
  define: {
    'process.env.NODE_ENV': isWatchMode ? '"development"' : '"production"'
  }
};

// Build process
async function build() {
  try {
    await esbuild.build(buildOptions);
    copyStaticFiles();
    console.log('Build completed successfully');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

// Watch process
async function watch() {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  copyStaticFiles();
  console.log('Watching for changes...');
}

// Run build or watch
if (isWatchMode) {
  watch();
} else {
  build();
}
