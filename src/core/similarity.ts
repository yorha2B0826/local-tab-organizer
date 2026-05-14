import { tokenize } from "./tokenizer";
import type { TabInfo } from "./types";

export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function tabFeatureText(tab: TabInfo): string {
  let path = "";
  try {
    path = new URL(tab.url).pathname;
  } catch {
    path = tab.url;
  }
  return `${tab.title} ${tab.domain} ${path}`;
}

class UnionFind {
  private parent = new Map<number, number>();

  constructor(ids: number[]) {
    for (const id of ids) this.parent.set(id, id);
  }

  find(id: number): number {
    const parent = this.parent.get(id) ?? id;
    if (parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}

export function clusterTabsBySimilarity(tabs: TabInfo[], threshold: number): number[][] {
  const uf = new UnionFind(tabs.map((tab) => tab.id));
  const features = new Map<number, string[]>();
  for (const tab of tabs) features.set(tab.id, tokenize(tabFeatureText(tab)));

  for (let i = 0; i < tabs.length; i += 1) {
    for (let j = i + 1; j < tabs.length; j += 1) {
      const similarity = jaccardSimilarity(features.get(tabs[i].id) ?? [], features.get(tabs[j].id) ?? []);
      if (similarity >= threshold) uf.union(tabs[i].id, tabs[j].id);
    }
  }

  const groups = new Map<number, number[]>();
  for (const tab of tabs) {
    const root = uf.find(tab.id);
    groups.set(root, [...(groups.get(root) ?? []), tab.id]);
  }
  return [...groups.values()];
}
