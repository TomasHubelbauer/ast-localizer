# AST Localizer

This is a project where I attempt to see if replacing string literals with their
localized versions (or a localizer function invocations) could feasibly be done
by running a `postbuild` step which uses the TypeScript compiler API to pull out
the string literals and replace/augment them.

## Running

I am using Create React App as a stand-in for a real-wold JavaScript project.
This tool is general and doesn't rely on CRA, it is used merely as an example.

First time around, run `npm install` to make sure the `create-react-app` dev
dependency and the `source-map` and `typescript` dependencies are installed.

`create-react-app` is used later to scaffold a Create React App application from
the template and it is installed as a development dependency so that NPX doesn't
interactively ask for a permission to install it globally.

To run, do `npm start` which scaffolds the Create React App application in the
`cra` directory unless it already exists.
Next up, it runs `npm install` followed by `npm run build` in `cra` unless the
`cra/build` directory already exists.
After that, it copies `cra/build` into a new directory named `docs`.
Finally, `node .` is ran which runs the main script which can now safely assume
a fresh copy of `docs` exists and it can also transform the files in there.
`docs` will be used to host a GitHub Pages demonstration of the result in the
future.

## Features

Scans JavaScript source code (optionally built) and replaces found string
literals with their corresponding translations based on a translation file.

Looks up translation based on several key variants to enable easy authoring of
the translations as well as distinguishing potential conflicts:

- Translate by text
- Translate by path and text
- Translate by line, char and text
- Leave out leading and trailing white-space if desired - it will be recovered!

## To-Do

### Configure `homepage` in the `cra` `package.json` to fix hosting on GH Pages

GH Pages run off a relative path so they need this setting to be configured:
https://create-react-app.dev/docs/deployment/#building-for-relative-paths

### Consider turning this into a Babel plugin (TypeScript doesn't have plugins)

Babel transformations:
- https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
- https://lihautan.com/step-by-step-guide-for-writing-a-babel-transformation/

The TypeScript compiler doesn't have support for custom transformations, only
language service plugins:

https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin

These are not useful in my case as the transformation should run as a post-build
step and not an interactive functionality.

https://github.com/cevek/ttypescript exists but not many people use it or would
switch to it just for the support of this functionality.

### Ship this as an NPM library which can be installed and run as a post-step

Publish this to NPM automatically and make it an executable package so that
people can run `npx ast-localize` in their `postbuild` script in `package.json`.

### Implement replacing with a localizer function for runtime switching

This will be a bit more complex but still totally doable and it will enable apps
with runtime language switching with no need for localization logic in the code.

Instead of replacing a string literal node with another, replace it with either
a function call node or maybe even an array access node with the indexer being
the currently selected language ISO code stored in the local storage.

### Enable a GitHub Pages static site demo based on the `docs` directory

This will demonstrate the translated site and when we have localizer functions
even runtime language switching.

### Add a GitHub Actions workflow to bump this whenever new CRA versions drop

This way the `cra` scaffold will be always current and while that's ignored, the
`docs` output is tracked as it will be used for GitHub Pages so the effects of
CRA changes can be apparent in the contents of this repository and as such it is
desirable to keep the ouput current with respect to the input.

## Figure out why both `startMap` and `endMap` always share line and column

This is not the case in the original reproduction repo:
https://github.com/TomasHubelbauer/babel-sourcemap
