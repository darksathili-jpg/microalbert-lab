import { parser } from "./lezer/python.mjs";
import { highlightTree, tagHighlighter, tags } from "./lezer/highlight.mjs";

const colors = tagHighlighter([
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword, tags.operatorKeyword], class: "py-keyword" },
  { tag: [tags.function(tags.variableName), tags.function(tags.definition(tags.variableName)),
    tags.function(tags.propertyName), tags.className], class: "py-function" },
  { tag: [tags.string, tags.special(tags.string)], class: "py-string" },
  { tag: [tags.number, tags.bool, tags.null], class: "py-value" },
  { tag: tags.comment, class: "py-comment" },
  { tag: [tags.operator, tags.punctuation, tags.modifier, tags.escape], class: "py-symbol" }
]);

export function colorerPython(source, element) {
  const document = element.ownerDocument;
  const fragment = document.createDocumentFragment();
  let position = 0;
  highlightTree(parser.parse(source), colors, (from, to, style) => {
    if (from > position) fragment.append(document.createTextNode(source.slice(position, from)));
    const token = document.createElement("span");
    token.className = style;
    token.textContent = source.slice(from, to);
    fragment.append(token);
    position = to;
  });
  fragment.append(document.createTextNode(source.slice(position)));
  element.replaceChildren(fragment);
}
