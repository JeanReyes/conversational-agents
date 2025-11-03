export type SnapshotNode = {
  role?: string;
  name?: string; // accessible name
  ref?: string;
  text?: string;
  children?: SnapshotNode[];
};

export function parseSnapshot(result: unknown): SnapshotNode | null {
  try {
    const anyRes = result as { content?: Array<{ type: string; text?: string }> };
    const textEntry = anyRes?.content?.find((c) => c.type === 'text');
    if (!textEntry?.text) return null;
    const data = JSON.parse(textEntry.text);
    return (data as SnapshotNode) ?? null;
  } catch {
    return null;
  }
}

export function findFirstByPredicate(
  root: SnapshotNode | null,
  predicate: (n: SnapshotNode) => boolean,
): SnapshotNode | null {
  if (!root) return null;
  const stack: SnapshotNode[] = [root];
  while (stack.length) {
    const node = stack.shift()!;
    if (predicate(node)) return node;
    if (node.children && node.children.length) stack.unshift(...node.children);
  }
  return null;
}

export function extractTopTitles(root: SnapshotNode | null, max: number): string[] {
  if (!root) return [];
  const titles: string[] = [];
  const stack: SnapshotNode[] = [root];
  const seen = new Set<string>();
  while (stack.length && titles.length < max) {
    const node = stack.shift()!;
    const name = node.name?.trim();
    if (node.role === 'link' && name && name.length > 3) {
      if (!seen.has(name)) {
        seen.add(name);
        titles.push(name);
      }
    }
    if (node.children && node.children.length) stack.unshift(...node.children);
  }
  return titles;
}


