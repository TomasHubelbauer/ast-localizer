# CRA AST Localize

[**WEB**](https://tomashubelbauer.github.io/cra-ast-localize)

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

Rename to just AST localizer then, it should be more generic than just React.
We will need to add logic for recognizing minimized files with source maps in
case of React etc. and normal sources files further unprocessed so that we do
the original context lookup where it makes sense or just go with the source file
where there is no mapping to take into an account.

### Replace the hardcoded text replacement with a localizer function invocation

Add two modes to work in:

One where the text gets replace with a localizer version and the localized
version with the hardcoded localized strings gets saved with a locale suffix.
This mode is useful for translating app to another locale statically without any
runtime localization support.

Another where the string literals get replaced with a call to a localizer
function so that at runtime, a locale can be selected and on next render, the
strings are pulled from the new locale.

### Await for the string literal source mapping issue to get fixed

https://github.com/TomasHubelbauer/cra-sourcemap
