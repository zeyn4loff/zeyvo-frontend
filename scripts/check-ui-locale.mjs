import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const sourceRoot = path.resolve("src");
const localeRoot = path.join(sourceRoot, "features/locale");
const dictionary = ["customerText.ts", "uiTextCatalog.ts", "ruUiTextCatalog.ts", "trEnUiTextCatalog.ts"]
  .map((name) => fs.readFileSync(path.join(localeRoot, name), "utf8"))
  .join("\n");
const known = new Set([...dictionary.matchAll(/^\s*"([^"\n]+)":/gm)].map((match) => match[1]));
const ruCatalog = fs.readFileSync(path.join(localeRoot, "ruUiTextCatalog.ts"), "utf8");
const trEnCatalog = fs.readFileSync(path.join(localeRoot, "trEnUiTextCatalog.ts"), "utf8");
const ruKeys = new Set([...ruCatalog.matchAll(/^  ("(?:\\.|[^"\\])*"):/gm)].map((match) => match[1]));
const trEnKeys = new Set([...trEnCatalog.matchAll(/^  ("(?:\\.|[^"\\])*"):/gm)].map((match) => match[1]));
const visibleAttributes = new Set([
  "placeholder", "aria-label", "title", "label", "description", "detail",
  "itemFromLabel", "hint", "actionLabel", "submitLabel", "emptyMessage",
  "alt", "zeroLabel", "suffix", "cancelLabel",
]);
const azLetters = /[əğışçöüƏĞİŞÇÖÜ]/;
const errors = [];
for (const key of ruKeys) {
  if (!trEnKeys.has(key)) errors.push(`Нет турецкого и английского перевода для ${key}`);
}

function checkKey(key, file, node, source) {
  if (azLetters.test(key) && !known.has(key)) {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    errors.push(`${file}:${line}: нет русского перевода для ${JSON.stringify(key)}`);
  }
}

function checkFile(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxText(node) && azLetters.test(node.text.trim())) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      errors.push(`${file}:${line}: текст JSX не подключён к переводу`);
    }
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)
      && visibleAttributes.has(node.name.getText(source)) && azLetters.test(node.initializer.text)) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      errors.push(`${file}:${line}: атрибут ${node.name.getText(source)} не подключён к переводу`);
    }
    if (ts.isCallExpression(node) && ["t", "translateUi"].includes(node.expression.getText(source))
      && node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
      checkKey(node.arguments[0].text, file, node, source);
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "LocalizedText") {
      const value = node.attributes.properties.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "value");
      if (value?.initializer && ts.isJsxExpression(value.initializer) && value.initializer.expression
        && ts.isStringLiteral(value.initializer.expression)) {
        checkKey(value.initializer.expression.text, file, node, source);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith(".tsx")) checkFile(file);
  }
}

walk(sourceRoot);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Статические строки интерфейса подключены к переводам на русский, турецкий и английский.");
}
