import fs from 'fs';
import sourcemap from 'source-map';
import typescript from 'typescript';

// Control whether skipped string literals should be logged or not
const debug = false;

const localizationFile = process.argv[2] + '.json';
const translations = JSON.parse(await fs.promises.readFile(localizationFile));

// Ignore `node_modules` to not attempt to translate stuff in dependencies
// Ignore `webpack`-related paths to not attempt to translate chunk-loading etc.
// Ignore non-JavaScript/JSX and non-TypeScript/TSX sources to avoid assets
// (e.g. SVGs whose contents or paths end up inlined into the bundle)
const ignoreRegex = /node_modules|webpack|(?<!.[jt]sx?)$/;
const limit = 15;
const root = 'docs/static/js';
for (const path of await fs.promises.readdir(root)) {
  if (!path.endsWith('.js')) {
    continue;
  }

  const sourceMap = await new sourcemap.SourceMapConsumer(await fs.promises.readFile(`${root}/${path}.map`, 'utf-8'));
  const sourceFile = typescript.createSourceFile(path, await fs.promises.readFile(`${root}/${path}`, 'utf-8'));

  function makeTransformer(/** @type {typescript.TransformationContext} */ context) {
    return function visit(/** @type {typescript.Node} */ node) {
      return typescript.visitNode(node, node => {
        if (node.kind !== typescript.SyntaxKind.StringLiteral) {
          return typescript.visitEachChild(node, visit, context);
        }

        const { line: lineStart, character: characterStart } = sourceFile.getLineAndCharacterOfPosition(node.pos);
        const { line: lineEnd, character: characterEnd } = sourceFile.getLineAndCharacterOfPosition(node.end);
  
        // TODO: Figure out both `startMap` and `endMap` always have the same line and column
        const startMap = sourceMap.originalPositionFor({ line: lineStart + 1, column: characterStart });
        const endMap = sourceMap.originalPositionFor({ line: lineEnd + 1, column: characterEnd });

        if (!startMap.source || !endMap.source) {
          // Skip non-user string literals like `use strict` and `__esModule`
          return node;
        }

        if (startMap.source.match(ignoreRegex) || endMap.source.match(ignoreRegex)) {
          // Skip over string literals coming from dependencies, assets etc.
          return node;
        }

        const text = node.text;
        const trimmedText = text.trim();

        /** @type {{ text: string; key: string; trimmed: boolean; } | undefined} */
        let translation;

        // Offer the convenience of not having to use leading and trailing space
        // TODO: Also enable keys with positions from the source map not build
        const keys = [
          // Look for a 1:1 string to string translation regardless of context
          { key: text },
          { key: trimmedText, trimmed: true },

          // Look for a translation for a string from a file at a given path
          { key: path + ':' + text },
          { key: path + ':' + trimmedText, trimmed: true },
          
          // Look for a translation for a string from a given file and position
          { key: `${path}:${lineStart}:${characterStart}:${text}` },
          { key: `${path}:${lineStart}:${characterStart}:${trimmedText}`, trimmed: true },
        ];

        // Look for a few variations of keys to find the right translation
        for (const { key, trimmed } of keys) {
          const text = translations[key];
          if (text !== undefined) {
            const textDebug = text.length > limit ? text.slice(0, limit) + '…' : text;
            const keyDebug = key.length > limit ? key.slice(0, limit) + '…' : key;
            translation = { text, textDebug, key, keyDebug, trimmed };
            break;
          }
        }

        const textDebug = text.length > limit ? text.slice(0, limit) + '…' : text;
        if (!translation) {
          debug && console.debug(`Skipped "${textDebug}" as it has no translation in ${localizationFile}`);
          return node;
        }

        // Recover leading and/or trailing white-space if the key omitted it
        if (translation.trimmed) {
          const leadingWhitespace = text.match(/^\s+/)?.[0] ?? '';
          const trailingWhitespace = text.match(/\s+$/)?.[0] ?? '';
          translation.text = leadingWhitespace + translation.text + trailingWhitespace;
        }

        console.log(`Replaced "${textDebug}" with "${translation.textDebug}" from ${localizationFile} under "${translation.keyDebug}" in ${path}`);
        return context.factory.createStringLiteral(translation.text);
      });
    }
  }

  const { transformed: [targetFile] } = typescript.transform(sourceFile, [makeTransformer]);
  await fs.promises.writeFile(`${root}/${path}`, typescript.createPrinter().printFile(targetFile));
}
