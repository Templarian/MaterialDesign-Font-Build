#!/usr/bin/env node

const yargs = require('yargs');
const webfont = require("webfont").default;
const sass = require('sass');
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
  .option('mode', {
    description: 'Preview --mode defaults to webfont; svg will inline SVG instead',
    default: 'webfont',
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
  .option('fontSvg', {
    description: 'Include SVG font in output',
    default: false,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .version()
  .argv;

let distFolder = path.resolve(argv.dist);
let metaFile = path.resolve(argv.dir, 'meta.json');
let fontBuildFile = path.resolve(argv.dir, 'font-build.json');
let svgFolder = path.resolve(argv.dir, 'svg');
if (argv.meta !== './meta.json') {
  // Use --meta ./otherfile.json
  metaFile = path.resolve(argv.meta);
}
if (argv.font !== './font-build.json') {
  // Use --font ./otherfile.json
  fontBuildFile = path.resolve(argv.font);
}
if (argv.svg !== './svg') {
  // Use --svg ./other/directory/svg
  svgFolder = path.resolve(argv.svg);
}

if (!fs.existsSync(fontBuildFile)) {
  console.error(`Unable to find "${fontBuildFile}". Use --help to learn more.`);
  process.exit(1);
}

if (!fs.existsSync(metaFile)) {
  console.error(`Unable to find "${metaFile}". Use --help to learn more.`);
  process.exit(1);
}

if (!fs.existsSync(svgFolder)) {
  console.error(`Unable to find "${svgFolder}" folder. Use --help to learn more.`);
  process.exit(1);
}

const mode = argv.mode;

const fontBuildString = fs.readFileSync(fontBuildFile);
const fontBuildJson = {
  prefix: 'default',
  name: 'default name',
  icon: 'M0,0H8V3H18V0H26V8H23V18H26V26H18V23H8V21H18V18H21V8H18V5H8V8H5V18H8V26H0V18H3V8H0V0M2,2V6H6V2H2M2,20V24H6V20H2M20,2V6H24V2H20M20,20V24H24V20H20Z',
  ...JSON.parse(fontBuildString)
};
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
  process.exit(1);
}

function generateFolders() {
  if (!fs.existsSync(distFolder)) {
    fs.mkdirSync(distFolder, { recursive: true });
  }
  const folders = ['scss', 'css', 'fonts'];
  folders.forEach(folder => {
    if (!fs.existsSync(path.join(distFolder, folder))) {
      fs.mkdirSync(path.join(distFolder, folder));
    }
  });
  console.log('- Folders created.');
}

function generateHtmlWebfont() {
  const {
    prefix,
    name,
    icon,
    fileName,
    fontName,
    fontFamily,
    fontWeight,
    version,
    npmFont,
    npmJS,
    npmSVG,
    website
  } = fontBuildJson;
  const htmlSrc = path.resolve(__dirname, '..', 'src', 'index.html');
  const htmlDist = path.resolve(distFolder, 'index.html');
  const icons = [];
  metaJson.forEach(icon => {
    const deprecated = icon.deprecated ? ',deprecated:true' : '';
    icons.push(`{name:"${icon.name}",hex:"${icon.codepoint}",version:"${icon.version}"${deprecated}}`);
  });
  const htmlString = fs.readFileSync(htmlSrc, 'utf8')
    .replace(/prefix/g, prefix)
    .replace(/packageName/g, name)
    .replace(/packageIcon/g, icon)
    .replace(/fileName/g, fileName)
    .replace(/fontName/g, fontName)
    .replace(/fontFamily/g, fontFamily)
    .replace(/fontWeight/g, fontWeight)
    .replace(/-.-.-/g, `${version.major}.${version.minor}.${version.patch}`)
    .replace(/npmFont/g, npmFont)
    .replace(/npmJS/g, npmJS)
    .replace(/npmSVG/g, npmSVG)
    .replace(/domain\.com/g, website)
    .replace(/icons = \[\]/, `icons = [${icons.join(',')}]`);
  fs.writeFileSync(htmlDist, htmlString);
  console.log('- Generated index.html');
}

function generateHtmlSvg() {
  const {
    prefix,
    name,
    icon,
    fileName,
    fontName,
    fontFamily,
    fontWeight,
    version,
    npmFont,
    npmJS,
    npmSVG,
    website,
    date
  } = fontBuildJson;
  const htmlSrc = path.resolve(__dirname, '..', 'src', 'index-svg.html');
  const htmlDist = path.resolve(distFolder, 'index.html');
  const icons = [];
  metaJson.forEach(icon => {
    const deprecated = icon.deprecated ? ',deprecated:true' : '';
    const svgFile = path.resolve(svgFolder, `u${icon.codepoint}-${icon.name}.svg`);
    const svgData = fs.readFileSync(svgFile, 'utf8');
    const data = svgData.match(/ d="([^"]+)"/)[1];
    icons.push(`{name:"${icon.name}",data:"${data}",hex:"${icon.codepoint}",version:"${icon.version}"${deprecated}}`);
  });
  const htmlString = fs.readFileSync(htmlSrc, 'utf8')
    .replace(/prefix/g, prefix)
    .replace(/packageName/g, name)
    .replace(/packageIcon/g, icon)
    .replace(/fileName/g, fileName)
    .replace(/fontName/g, fontName)
    .replace(/fontFamily/g, fontFamily)
    .replace(/fontWeight/g, fontWeight)
    .replace(/-.-.-/g, `${version.major}.${version.minor}.${version.patch}`)
    .replace(/npmFont/g, npmFont)
    .replace(/npmJS/g, npmJS)
    .replace(/npmSVG/g, npmSVG)
    .replace(/domain\.com/g, website)
    .replace(/var date = null;/g, `var date = ${JSON.stringify(date)};`)
    .replace(/icons = \[\]/, `icons = [${icons.join(',')}]`);
  fs.writeFileSync(htmlDist, htmlString);
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
    .replace(/domain\.com/, website);
  fs.writeFileSync(mainDist, mainString);
  console.log(`- Generated ${fileName}.scss`);
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
    let otherString = fs.readFileSync(other, 'utf8')
      .replace(/prefix/g, prefix)
      .replace(/fileName/g, fileName)
      .replace(/fontName/g, fontName)
      .replace(/fontFamily/g, fontFamily)
      .replace(/fontWeight/g, fontWeight)
      .replace(/-.-.-/g, `${version.major}.${version.minor}.${version.patch}`)
      .replace(new RegExp(`${prefix}-css-${prefix}`, 'g'), `${prefix}-css-prefix`);
    if (file === 'variables') {
      const icons = [];
      metaJson.forEach(icon => {
        icons.push(`  "${icon.name}": ${icon.codepoint}`);
      });
      otherString = otherString.replace(/icons: \(\)/, `icons: (\n${icons.join(',\n')}\n)`);
    }
    fs.writeFileSync(otherDist, otherString);
    console.log(`  - Generated _${file}.scss`);
  });
}

function generateCSS() {
  const { fileName } = fontBuildJson;
  sass.render({
    file: path.resolve(distFolder, 'scss', `${fileName}.scss`),
    outputStyle: 'expanded',
    sourceMap: true,
    outFile: `${fileName}.css`
  }, function(err, result) {
    if (err) {
      console.error(err);
    } else {
      fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.css`), result.css);
      const mapData = Buffer.from(result.map.toString('utf8').replace(/dist\//g, '../'));
      fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.css.map`), mapData);
    }
  });
  sass.render({
    file: path.resolve(distFolder, 'scss', `${fileName}.scss`),
    outputStyle: 'compressed',
    sourceMap: true,
    outFile: `${fileName}.css`
  }, function(err, result) {
    if (err) {
      console.error(err);
    } else {
      fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.min.css`), result.css);
      const mapData = Buffer.from(result.map.toString('utf8').replace(/dist\//g, '../'));
      fs.writeFileSync(path.join(distFolder, 'css', `${fileName}.min.css.map`), mapData);
    }
  });
  console.log(`- Generated ${fileName}.css / *.min.css / *.map`);
}

const formats = ['ttf', 'eot', 'woff', 'woff2'];
if (argv.fontSvg) {
  formats.push('svg');
}

function getConfig() {
  const {
    fontName,
    version
  } = fontBuildJson;
  const config = {
    files: argv.svg !== './svg'
      ? `${argv.svg}/*.svg`
      : argv.dir.match(/\/$/)
        ? `${argv.dir}svg/*.svg`
        : `${argv.dir}/svg/*.svg`,
    fontName,
    formats: formats,
    fontHeight: 512,
    descent: 64
  };
  if (fontBuildJson.version) {
    const { major, minor, patch } = version;
    config.version = `${major}.${minor}.${patch}`;
  }
  return config;
}

webfont(getConfig())
.then(result => {
  const { fileName } = fontBuildJson;
  generateFolders();
  fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.ttf`), result.ttf);
  fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.eot`), result.eot);
  fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.woff`), result.woff);
  fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.woff2`), result.woff2);
  if (argv.fontSvg) {
    fs.writeFileSync(path.join(distFolder, 'fonts', `${fileName}-webfont.svg`), result.svg);
  }
  console.log(`- Generated ttf, eot, woff, and woff2${argv.fontSvg && ' + svg'}`);
  if (mode === 'webfont') {
    generateHtmlWebfont();
  } else if (mode === 'svg') {
    generateHtmlSvg();
  } else {
    console.error(`Invalid mode, only "webfont" and "svg" supported.`);
  }
  generateSCSS();
  generateCSS();
  return result;
})
.catch(error => {
  console.error(error);
  throw error;
});
