const esbuild = require('esbuild');
const { copyFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const isWatchMode = process.argv.includes('--watch');

// Make sure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist');
}

// Copy static files
const copyStaticFiles = () => {
  try {
    copyFileSync('./src/manifest.json', './dist/manifest.json');
    copyFileSync('./src/popup.html', './dist/popup.html');
    copyFileSync('./src/options.html', './dist/options.html');
    
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
    'src/popup.ts',
    'src/options.ts'
  ],
  bundle: true,
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
