# CRA AST Localize

This is a project where I attempt to see if the following would work:

- Scaffold a normal CRA project
- Add a post-build script which reads the AST of the emitted files
- Use source maps to find code corresponding to user files and avoid code from dependencies
- Replace string literals with a call to a localizer function (like `localize('')`)
- Use context heuristics to kick out invalid literals (identifiers, JSX/TSX, …)
- Warn on localization keys which are not contained within the localization files
- Append the localizer function implementation and the localization resources
- Observe a localized application without the need to clutter the code with resource lookup

`npm build` or `npm run postbuild` with an existing `build` directory

- Add a non-CRA version hosted on GitHub Pages with JS/TS source input on one side and compiled output on the other for a demo
