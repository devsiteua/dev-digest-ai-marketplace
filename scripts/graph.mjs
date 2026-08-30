/**
 * Dependency-graph resolution for the marketplace.
 *
 * Catches locally what `claude plugin list --json` would otherwise report in
 * somebody else's repository after they install: a dependency that no plugin
 * provides, a version range nothing satisfies, and a cycle.
 *
 * Only the two range forms docs/PLUGIN-GUIDELINES.md allows are understood —
 * a caret range and an exact pin. Anything else is a policy error, not an
 * unsupported feature.
 */

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

/** Placeholder version for a plugin that has never been released. */
export const UNRELEASED = '0.0.0';

function parse(version, what) {
  const m = SEMVER.exec(version);
  if (!m) throw new Error(`${what}: "${version}" is not a semantic version`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const gte = (a, b) =>
  a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] >= b[2];

/**
 * A caret range is bounded by the leftmost non-zero component, so ^1.2.3 admits
 * <2.0.0 while ^0.1.2 admits only <0.2.0.
 */
function satisfies(version, range, what) {
  const v = parse(version, what);

  if (!range.startsWith('^')) {
    const pinned = parse(range, `${what} range`);
    return v.join('.') === pinned.join('.');
  }

  const min = parse(range.slice(1), `${what} range`);
  if (!gte(v, min)) return false;

  if (min[0] > 0) return v[0] === min[0];
  if (min[1] > 0) return v[0] === 0 && v[1] === min[1];
  return v[0] === 0 && v[1] === 0;
}

/**
 * Resolves the graph and returns per-plugin `dependents` and the transitive
 * `resolvedDependencies`, plus every problem found.
 *
 * A range left unsatisfied by an unreleased dependency is a note, not an error:
 * before the first release every manifest still carries 0.0.0 and every range
 * already points at the version it will be tagged with. That note becomes an
 * error the moment the dependency is released, which is the point at which it
 * would actually break an installation.
 */
export function resolveGraph(plugins) {
  const byName = new Map(plugins.map((p) => [p.name, p]));
  const errors = [];
  const notes = [];

  for (const plugin of plugins) {
    for (const dep of plugin.dependencies ?? []) {
      if (dep.name === plugin.name) {
        errors.push(`${plugin.name}: depends on itself`);
        continue;
      }

      const target = byName.get(dep.name);
      if (!target) {
        errors.push(
          `${plugin.name}: depends on "${dep.name}", which no plugin in this marketplace provides`
        );
        continue;
      }

      const what = `${plugin.name} -> ${dep.name}`;
      if (satisfies(target.version, dep.version, what)) continue;

      const message = `${what}: requires ${dep.version}, ${dep.name} is at ${target.version}`;
      if (target.version === UNRELEASED) notes.push(`${message} (unreleased)`);
      else errors.push(message);
    }
  }

  // Depth-first walk; a name already on the current path closes a cycle.
  const cycles = [];
  const done = new Set();
  const walk = (name, path) => {
    if (path.includes(name)) {
      cycles.push([...path.slice(path.indexOf(name)), name].join(' -> '));
      return;
    }
    if (done.has(name)) return;
    for (const dep of byName.get(name)?.dependencies ?? []) {
      if (byName.has(dep.name)) walk(dep.name, [...path, name]);
    }
    done.add(name);
  };
  for (const plugin of plugins) walk(plugin.name, []);
  for (const cycle of new Set(cycles)) errors.push(`Dependency cycle: ${cycle}`);

  const closure = (name, seen = new Set()) => {
    for (const dep of byName.get(name)?.dependencies ?? []) {
      if (seen.has(dep.name) || !byName.has(dep.name)) continue;
      seen.add(dep.name);
      closure(dep.name, seen);
    }
    return seen;
  };

  const graph = new Map(
    plugins.map((p) => [
      p.name,
      {
        dependents: plugins
          .filter((o) => (o.dependencies ?? []).some((d) => d.name === p.name))
          .map((o) => o.name),
        // Empty when a cycle was found — the closure is not meaningful then.
        resolvedDependencies: cycles.length ? [] : [...closure(p.name)].sort(),
      },
    ])
  );

  return { graph, errors, notes };
}
