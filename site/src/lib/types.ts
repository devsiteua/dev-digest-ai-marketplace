/** The shape of the generated catalog. Mirrors docs/SITE-SPEC.md § index.json. */

export type ArtifactKind = 'agent' | 'skill' | 'command' | 'hook';

export interface Dependency {
  name: string;
  version: string;
}

export interface Artifact {
  id: string;
  kind: ArtifactKind;
  name: string;
  plugin: string;
  description: string;
  model: string | null;
  tools: string[];
  keywords: string[];
  bodyId: string;
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string | null;
  license: string | null;
  homepage: string | null;
  keywords: string[];
  dependencies: Dependency[];
  compatibility: { claudeCode: string } | null;
  /** Ids into `Index.artifacts`; the objects live there once, not per plugin. */
  artifacts: string[];
  /** Every plugin that depends on this one, resolved by scripts/graph.mjs. */
  dependents?: string[];
  /** The transitive closure a user actually installs. */
  resolvedDependencies?: string[];
  bodyId: string | null;
}

export interface Index {
  generatedAt: string;
  marketplace: { name: string; owner: string | null; description: string };
  plugins: Plugin[];
  artifacts: Artifact[];
}

export interface Release {
  plugin: string;
  version: string;
  /** Null when the changelog entry carries no date. Never guessed. */
  date: string | null;
  tag: string;
  sections: Record<string, string[]>;
}

export interface Releases {
  generatedAt: string;
  releases: Release[];
}

export interface Stats {
  generatedAt: string;
  plugins: number;
  artifacts: number;
  artifactsByKind: Partial<Record<ArtifactKind, number>>;
  releases: number;
  /** Null when nothing is released. The UI says so rather than inventing one. */
  latestRelease: string | null;
}

export interface Catalog {
  index: Index;
  releases: Releases;
  stats: Stats;
}
