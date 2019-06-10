# CRA AST Localize

This is a project where I attempt to see if the following would work:

- Scaffold a normal CRA project
- Add a post-build script which reads the AST of the emitted files
- Replace string literals with a call to a localizer function
- Check for localization keys which are not contained within the localization files
- Observe a localized application without the need to clutter the code with resource lookup
