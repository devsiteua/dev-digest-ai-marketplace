/**
 * Catalog shell.
 *
 * Scope note: this is the scaffold that keeps the build and the deploy workflow
 * honest from the first pull request. Routing, search and the plugin detail
 * pages specified in docs/SITE-SPEC.md are built once the plugins are populated.
 */
export function App() {
  return (
    <main className="shell">
      <h1>DevDigest AI Marketplace</h1>
      <p>
        A Claude Code plugin marketplace: the spec-driven development workflow
        and the shared engineering practices it builds on.
      </p>
      <pre>
        <code>
          claude plugin marketplace add devsiteua/dev-digest-ai-marketplace
        </code>
      </pre>
      <p className="note">
        The catalog UI is under construction. Until it lands, the plugins are
        documented in the repository.
      </p>
    </main>
  );
}
