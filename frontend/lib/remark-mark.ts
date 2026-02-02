import { visit } from 'unist-util-visit';
import type { Root, Text, Html } from 'mdast';

/**
 * Remark plugin to support ==highlight== syntax.
 * Converts ==text== to <mark>text</mark> HTML nodes.
 */
export function remarkMark() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || !parent) return;

      const regex = /==(.*?)==/g;
      if (!regex.test(node.value)) return;

      regex.lastIndex = 0;

      const children: (Text | Html)[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          children.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }
        children.push({ type: 'html', value: `<mark>${match[1]}</mark>` });
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        children.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      if (children.length > 0) {
        parent.children.splice(index, 1, ...children);
      }
    });
  };
}
