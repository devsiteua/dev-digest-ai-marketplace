# Sources

What the rules in `SKILL.md` are built on, and what each source contributed.

## The canon

- [The Onion Architecture, part 1](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
  — Jeffrey Palermo, 2008. The origin: all coupling points toward the centre, the database
  is external, infrastructure is pushed out behind interfaces.
- [part 2](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-2/) ·
  [part 3](https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/) — the layers in
  detail and how the composition root wires them.
- [part 4 — after four years](https://jeffreypalermo.com/2013/08/onion-architecture-part-4-after-four-years/)
  — the author's own retrospective. Read it before adding ceremony.
- [Onion Architecture — Herberto Graça](https://herbertograca.com/2017/09/21/onion-architecture/)
  — where onion sits relative to ports-and-adapters and clean architecture. Useful when
  someone argues the three are different things.
- [Onion Architecture — Allegro Tech](https://blog.allegro.tech/2023/02/onion-architecture.html)
  — a production team's account, including where the pattern cost them.
- [Anemic domain model](https://en.wikipedia.org/wiki/Anemic_domain_model) — the failure mode
  a formally layered codebase drifts into, and the reason `SKILL.md` ends with "keep it
  proportional".

## Applied practice

- [Clean Node.js Architecture — Khalil Stemmler](https://khalilstemmler.com/articles/enterprise-typescript-nodejs/clean-nodejs-architecture/)
  — layering without a DI framework, which is how most composition roots actually look.
- [Ports and Adapters explained with two real codebases](https://saadh393.github.io/blog/adapter-port-architecture-two-cases)
  — the one-line version of the rule: business logic imports ports, never adapters.
- [Atomic Repositories in Clean Architecture and TypeScript — Sentry](https://blog.sentry.io/atomic-repositories-in-clean-architecture-and-typescript/)
  — repository boundaries, transaction handling, and translating persistence errors into
  domain errors without leaking the ORM outward.

## Enforcement

- [dependency-cruiser rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)
  — forbidden-rule syntax and baselines. Note the resolution caveat in
  [enforcement.md](enforcement.md): a package commonly resolves through its installed
  location, so a rule written against the bare package name can match nothing.
- [Restricting imports with dependency-cruiser — Atomic Object](https://spin.atomicobject.com/dependency-cruiser-imports/)
  — a short worked example of forbidding a direction of import.
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) —
  declaring architectural element types and the allowed edges between them.
- [import-linter](https://import-linter.readthedocs.io/) — layered, forbidden and
  independence contracts for Python.
- [ArchUnit](https://www.archunit.org/) — layer access rules expressed as ordinary tests.
- [How we enforce architecture boundaries at scale — lastminute.com](https://technology.lastminute.com/how-we-enforce-architecture-boundaries-at-scale-on-our-app/)
  — introducing a guard into a codebase that already has violations, which is the normal
  case rather than the exception.
