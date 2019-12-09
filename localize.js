const ts = require('typescript');
const fs = require('fs-extra');
const klaw = require('klaw');
const sourcemap = require('source-map');
const { relative } = require('path');

void async function () {
  const locale = process.argv[2];
  if (!locale) {
    return;
  }

  const resources = await fs.readJson('res/' + locale + '.json');
  for await (const file of klaw('build')) {
    // TODO: See if the second and third condition can be removed in favor of the sourcemap `source` check
    if (!file.path.endsWith('.js') || file.path.includes('runtime~min') || !file.path.includes('main.')) {
      if (file.stats.isFile()) {
        await fs.ensureFile(file.path.replace('build', `build-${locale}`));
        await fs.copyFile(file.path, file.path.replace('build', `build-${locale}`));
      }

      continue;
    }

    const sourceFile = ts.createSourceFile(
      file.path,
      String(await fs.readFile(file.path)),
      ts.ScriptTarget.ES5, // tsconfig.json
      true
    );

    await traverse(
      sourceFile,
      await new sourcemap.SourceMapConsumer(await fs.readJson(file.path + '.map')),
      resources
    );

    await fs.writeFile(file.path.replace('build', `build-${locale}`), sourceFile.getText());
  }
}()

async function traverse(/** @type{ts.Node} */ sourceFile, sourceMap, resources) {
  if (sourceFile.kind === 10) {
    /** @type{ts.LiteralLikeNode} */ const literalLikeNode = sourceFile;

    const length = literalLikeNode.text.length + 2 /* Quotes */;
    if (literalLikeNode.end - literalLikeNode.pos !== length) {
      throw new Error('Expected a quoted string literal!');
    }

    const { source, line, column, name } = sourceMap.originalPositionFor({ line: 1, column: literalLikeNode.pos });
    if (source && name === null && source !== '../webpack/bootstrap') {
      const filePath = 'src/' + source;
      const sourceFile = ts.createSourceFile(
        filePath,
        String(await fs.readFile(filePath)),
        ts.ScriptTarget.Latest,
        true
      );

      console.log(JSON.stringify(literalLikeNode.text));
      console.log(`  ${relative(process.cwd(), literalLikeNode.getSourceFile().fileName)}:1:${literalLikeNode.pos + 1}`);
      console.log(`  src/${source}:${line}:${column + 1}`);

      let node;
      getNode(sourceFile, line, column + 1, n => node = n);
      if (!node) {
        throw new Error('Chyba');
      }

      switch (node.kind) {
        case ts.SyntaxKind.StringLiteral: {
          if (node.text.length + 2 /* Quotes */ !== length) {
            throw new Error('The string lengths did not match up!');
          }

          if (literalLikeNode.text !== '' && resources[literalLikeNode.text] !== undefined) {
            literalLikeNode.text = resources[literalLikeNode.text];
            console.log('  Localized to', JSON.stringify(resources[node.text]));
          }
          else {
            console.log('  Left alone - no localization key for', JSON.stringify(resources[node.text]));
          }

          break;
        }
        case ts.SyntaxKind.FirstBinaryOperator: {
          console.log(`  Misidentified at the start of a JSX element: expected a string literal of length ${length} (including quotes), but got a JSX element angle bracket of length ${node.end - node.pos}`);
          break;
        }
      }
    }
  }

  for (const child of sourceFile.getChildren()) {
    await traverse(child, sourceMap, resources);
  }
}

function getNode(node, line, column, callback) {
  let { line: startLine, character: startColumn } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
  startLine++;
  startColumn++;
  let { line: endLine, character: endColumn } = node.getSourceFile().getLineAndCharacterOfPosition(node.getEnd());
  endLine++;
  endColumn++;
  if (startLine <= line && startColumn <= column && endLine >= line && endColumn >= column) {
    callback(node);
  }

  for (const child of node.getChildren()) {
    getNode(child, line, column, callback);
  }
}
