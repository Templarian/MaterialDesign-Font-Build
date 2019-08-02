#!/usr/bin/env node

const yargs = require('yargs');
const webfont = require("webfont").default;
const fs = require('fs');
const path = require('path');

const argv = yargs
  .option('dir', {
    description: 'Path to ./meta.json and ./svg folder with SVG files',
    default: './',
    type: 'string'
  })
  .option('meta', {
    description: 'Instead of --dir give path to ./meta.json',
    default: './meta.json',
    type: 'string'
  })
  .option('font', {
    description: 'Instead of --dir give path to ./font-build.json',
    default: './font-build.json',
    type: 'string'
  })
  .option('svg', {
    description: 'Instead of --dir give path to ./svg folder',
    default: './svg',
    type: 'string'
  })
  .option('dist', {
    description: 'Override ./dist folder for exported files',
    default: './dist',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .version()
  .argv;

const currentPath = process.cwd();
let distFolder = path.resolve(currentPath, argv.dist);
let metaFile = path.resolve(currentPath, argv.dir, 'meta.json');
let fontBuildFile = path.resolve(currentPath, argv.dir, 'font-build.json');
let svgFolder = path.resolve(currentPath, argv.dir, 'svg');
if (argv.meta !== './meta.json') {
  // Use --meta ./otherfile.json
  metaFile = path.resolve(currentPath, argv.meta);
}
if (argv.font !== './font-build.json') {
  // Use --font ./otherfile.json
  fontBuildFile = path.resolve(currentPath, argv.font);
}
if (argv.svg !== './svg') {
  // Use --svg ./other/directory/svg
  svgFolder = path.resolve(currentPath, argv.svg);
}

if (!fs.existsSync(fontBuildFile)) {
  console.error(`Unable to find "${fontBuildFile}". Use --help to learn more.`);
}

if (!fs.existsSync(metaFile)) {
  console.error(`Unable to find "${metaFile}". Use --help to learn more.`);
}

if (!fs.existsSync(svgFolder)) {
  console.error(`Unable to find "${svgFolder}" folder. Use --help to learn more.`);
}

const fontBuildString = fs.readFileSync(fontBuildFile);
const fontBuildJson = JSON.parse(fontBuildString);
const metaString = fs.readFileSync(metaFile);
const metaJson = JSON.parse(metaString);

console.log(`Generating from ${metaJson.length} icons:`);

const errors = [];

metaJson.forEach(icon => {
  if (errors.length > 5) { return; }
  const newFile = path.join(svgFolder, `u${icon.codepoint}-${icon.name}.svg`);
  if (fs.existsSync(newFile)) {
    // Already Converted, so quick check
    return;
  }
  const oldFile = path.join(svgFolder, `${icon.name}.svg`);
  if (fs.existsSync(oldFile)) {
    fs.renameSync(oldFile, newFile);
  } else {
    errors.push(`Invalid icon at "${oldFile}"`)
  }
});

if (errors.length) {
  errors.forEach(error => {
    console.error(error);
  });
  console.error('etc...');
}

if (!fs.existsSync(distFolder)) {
  fs.mkdirSync(distFolder, { recursive: true });
}
if (!fs.existsSync(path.join(distFolder, 'scss'))) {
  fs.mkdirSync(path.join(distFolder, 'scss'));
}
if (!fs.existsSync(path.join(distFolder, 'css'))) {
  fs.mkdirSync(path.join(distFolder, 'css'));
}
if (!fs.existsSync(path.join(distFolder, 'css', 'fonts'))) {
  fs.mkdirSync(path.join(distFolder, 'css', 'fonts'));
}

function generateIndex() {
  console.log('- Generated index.html');
}

function generateSCSS() {
  const {
    prefix,
    fileName,
    fontName,
    fontFamily,
    fontWeight,
    version,
    website
  } = fontBuildJson;
  // {fileName}.scss
  const main = path.resolve(__dirname, '..', 'src', 'scss', 'main.scss');
  const mainDist = path.resolve(distFolder, 'scss', `${fileName}.scss`);
  const mainString = fs.readFileSync(main, 'utf8')
    .replace('domain.com', website);
  fs.writeFileSync(mainDist, mainString);
  // Others
  const others = [
    'animated',
    'core',
    'extras',
    'functions',
    'icons',
    'path',
    'variables'
  ];
  others.forEach(file => {
    const other = path.resolve(__dirname, '..', 'src', 'scss', `_${file}.scss`);
    const otherDist = path.resolve(distFolder, 'scss', `_${file}.scss`);
    const otherString = fs.readFileSync(other, 'utf8')
      .replace(/prefix/g, prefix)
      .replace(/fileName/g, fileName)
      .replace(/fontName/g, fontName)
      .replace(/fontFamily/g, fontFamily)
      .replace(/fontWeight/g, fontWeight)
      .replace(/-.-.-/g, `${version.major}.${version.minor}.${version.patch}`)
      .replace(new RegExp(`${prefix}-css-${prefix}`, 'g'), `${prefix}-css-prefix`);
    fs.writeFileSync(otherDist, otherString);
  });
  console.log(`- Generated ${fileName}.scss`);
}

function generateCSS() {
  const { fileName } = fontBuildJson;
  console.log(`- Generated ${fileName}.css`);
}

webfont({
  files: 'svg/*.svg',
  fontName: "my-font-name",
  formats: ['ttf', 'eot', 'woff', 'woff2'],
  fontHeight: 512
})
.then(result => {
  fs.writeFileSync(path.join(distFolder, 'css', 'fonts', 'result.ttf'), result.ttf);
  fs.writeFileSync(path.join(distFolder, 'css', 'fonts', 'result.eot'), result.eot);
  fs.writeFileSync(path.join(distFolder, 'css', 'fonts', 'result.woff'), result.woff);
  fs.writeFileSync(path.join(distFolder, 'css', 'fonts', 'result.woff2'), result.woff2);
  console.log('- Generated ttf, eot, woff, and woff2');
  generateIndex();
  generateSCSS();
  generateCSS();
  return result;
})
.catch(error => {
  throw error;
});