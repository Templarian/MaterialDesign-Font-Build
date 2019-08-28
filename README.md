# @mdi/font-build

Goal: Build the Material Design Icons SVG icons to a webfont.

Most notably this generates `@mdi/font`, but is written to allow others to add custom icons or tweak the output.

## CLI

By installing `@mdi/font-build` globally one can generate their own webfont build.

```bash
# Install Globally
npm install -g @mdi/font-build
# Reads config from font-build.json
font-build
```

> To run without installing use `npx @mdi/font-build`

### Input

Any version of `@mdi/svg` v3.9.95+ will work with no changes. For earlier versions copy the `font-build.json` and update the `version: { major: 3, minor: 9, patch: 95 }` values.

Download from [MaterialDesign-SVG](https://github.com/Templarian/MaterialDesign-SVG)

> `font-build --help` explains all the possible overrides.

#### Folder Structure

```text
meta.json
font-build.json
svg/
  account.svg
  ...
```

> `font-build` is ran in the root of this folder.

### Output

The output is essentially the `@mdi/font` package that is released to NPM and the CDN after every release. These are built to target IE11+.

```text
dist/
  css/
    materialdesignicons.css
    materialdesignicons.css.map
    materialdesignicons.min.css
    materialdesignicons.min.css.map
  fonts/
    materialdesignicons-webfont.eot
    materialdesignicons-webfont.ttf
    materialdesignicons-webfont.woff
    materialdesignicons-webfont.woff2
  scss/
    materialdesignicons.scss
    _animated.scss
    _core.scss
    _extras.scss
    _functions.scss
    _icons.scss
    _paths.scss
    _variables.scss
  index.html
```

## Why is the SVG font not generated?

The `.svg` format is very heavy font format not used by modern browsers, but it can be included. Simply append the `--fontSvg` flag.

```
font-build --fontSvg
```

## Request Features

Please let us know if you need any features beyond the current CLI options by opening an issue.

## The `webfont` Package is Amazing!

99% of this is thanks to the https://www.npmjs.com/package/webfont package. They really have done amazing work.