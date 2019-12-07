# CRA AST Localize

This is a project where I attempt to see if the following would work:

- [x] Scaffold a normal CRA project
- [x] Add a post-build script which reads the AST of the emitted files
- [x] Use source maps to find code corresponding to user files and avoid code from dependencies
- [x] Use context heuristics to kick out invalid literals (identifiers, JSX/TSX, …)
- [ ] Replace string literals with a call to a localizer function (like `localize('')`)
- [ ] Warn on localization keys which are not contained within the localization files
- [ ] Append the localizer function implementation and the localization resources
- [ ] Observe a localized application without the need to clutter the code with resource lookup

`npm build` or `npm run postbuild` with an existing `build` directory

## To-Do

### Add a non-CRA version hosted on GitHub Pages

With JS/TS source input on one side and compiled output on the other for a demo

### Fix the node kind determination from the line and column values
