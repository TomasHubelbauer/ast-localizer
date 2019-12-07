const ts = require('typescript');
const fs = require('fs-extra');
const klaw = require('klaw');
const sourcemap = require('source-map');

void async function () {
  for await (const file of klaw('build')) {
    // TODO: Use source map and limit the inspection area only to user code not code from dependencies
    if (!file.path.endsWith('.js') || file.path.includes('runtime~min') || !file.path.includes('main.')) {
      continue;
    }

    const sourceFile = ts.createSourceFile(
      file.path,
      String(await fs.readFile(file.path)),
      ts.ScriptTarget.ES5, // tsconfig.json
      true
    );

    traverse(
      sourceFile,
      await new sourcemap.SourceMapConsumer(await fs.readJson(file.path + '.map'))
    );
    //await fs.writeFile(file.path.slice(0, -'.js'.length) + '.cs-cz.js', sourceFile.getText());
  }
}()

// TODO: Load localization resources from localization files
// TODO: Allow more context for being able to specify keys better (file name, class name, …)
const resources = {
  'Edit ': 'Upravte',
  ' and save to reload.': ' a ulozte zmeny pro obnoveni v prohlizeci.',
  'Learn React': 'Naucte se React',
};

// TODO: Filter out function names and dictionary keys and JSX/TSX and other invalic contexts
function traverse(/** @type{ts.Node} */ node, sourceMap) {
  if (node.kind === 10) {
    /** @type{ts.LiteralLikeNode} */ const literalLikeNode = node;

    const { source, line, column, name } = sourceMap.originalPositionFor({ line: 1, column: literalLikeNode.pos });
    if (source && name === null && source !== '../webpack/bootstrap') {
      console.log(JSON.stringify(literalLikeNode.text), `src/${source}:${line}:${column + 1}`, name);

      if (literalLikeNode.text !== '' && resources[literalLikeNode.text] !== undefined) {
        // TODO: Find a way to replace the node or update its text which reflects in the SourceFile.getText() output
        literalLikeNode.text = resources[literalLikeNode.text];
      }
    }
  }

  ts.forEachChild(node, node => traverse(node, sourceMap));
}
