import fs from 'fs';

// Patch `homepage` in `cra/package.json` for GitHub Pages to work
// TODO: Replace this with `jq` once I install it on my system 
const packageJson = JSON.parse(await fs.promises.readFile('cra/package.json'));
packageJson.homepage = 'https://tomashubelbauer.github.io/ast-localizer';
await fs.promises.writeFile('cra/package.json', JSON.stringify(packageJson, null, 2));
