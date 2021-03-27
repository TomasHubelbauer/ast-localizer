import fs from "fs";
import ts from "typescript";

void async function () {
  const srcStringLiterals = await collectSrcStringLiterals();
  const srcStrings = srcStringLiterals.map(node => node.text.trim());

  const buildStringLiterals = await collectBuildStringLiterals();
  const buildStrings = buildStringLiterals.filter(node => srcStrings.includes(node.text.trim()));

  const shifts = new Map();
  for (const buildString of buildStrings) {
    if (!shifts.has(buildString.sourceFile.fileName)) {
      shifts.set(buildString.sourceFile.fileName, 0);
    }

    const sourceFile = 'cra-sample/coverage/static/js/' + buildString.sourceFile.fileName;
    const sourceText = await fs.promises.readFile(sourceFile, 'utf-8');
    const shift = shifts.get(buildString.sourceFile.fileName);
    const before = sourceText.slice(shift, shift + buildString.pos);
    const after = sourceText.slice(shift + buildString.end);
    const newText = 'TROLOLO';
    const difference = newText.length - buildString.text.length;
    shifts.set(buildString.sourceFile.fileName, shift + difference);
    await fs.promises.writeFile(sourceFile, before + newText + after);
    console.log(sourceFile, { before, newText, after });
    console.log(buildString.text, sourceText.slice(shift + buildString.pos, shift + buildString.end), shift);
  }
}()

async function collectSrcStringLiterals() {
  const stringLiterals = [];
  const names = await fs.promises.readdir('cra-sample/src');
  for (const name of names) {
    if (!name.endsWith('.js')) {
      continue;
    }

    const sourceText = await fs.promises.readFile('cra-sample/src/' + name, 'utf-8');
    const sourceFile = ts.createSourceFile(name, sourceText, ts.ScriptTarget.Latest);
    collect(sourceFile, stringLiterals);
  }

  return stringLiterals;
}

async function collectBuildStringLiterals() {
  const stringLiterals = [];
  const names = await fs.promises.readdir('cra-sample/build/static/js');
  for (const name of names) {
    if (!name.endsWith('.js')) {
      continue;
    }

    const sourceText = await fs.promises.readFile('cra-sample/build/static/js/' + name, 'utf-8');
    const sourceFile = ts.createSourceFile(name, sourceText, ts.ScriptTarget.Latest);
    collect(sourceFile, stringLiterals);
  }

  return stringLiterals;
}

function collect(/** @type {ts.SourceFile} */ sourceFile, /** @type {ts.Node[]} */ strings, /** @type {ts.Node} */ node = sourceFile) {
  if (node.kind === 10 /* StringLiteral */ || node.kind === 11 /* JsxText */) {
    if (node.text.trim() !== '') {
      node.sourceFile = sourceFile;
      strings.push(node);
    }
  }

  ts.forEachChild(node, node => collect(sourceFile, strings, node));
}
