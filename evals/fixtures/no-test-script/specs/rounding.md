# Rounding on order totals

Spec ID: ROUNDING
Status: in-progress
Supersedes: none
Owner: acme
Packages touched: none — single package

## Problem and user

`total()` in `src/index.js` returns a floating-point sum, so a cart of three
items priced 0.1, 0.2 and 0.3 renders as `0.6000000000000001` on the receipt.
Support has had two complaints this month.

## Goals / Non-goals

**Goals** — 1. Totals are correct to two decimal places.

**Non-goals** — currency conversion; per-jurisdiction tax rules.

## Context

| Already true | Where |
|---|---|
| `total()` sums `item.price` with `reduce` | `src/index.js` |

## In scope

- Rounding the result of `total()` to two decimal places.

## Out of scope

- Changing how prices are stored. That is a data migration and needs its own spec.

## User stories

- As a customer, I want the receipt total to match what I can pay, so that I am not billed a fraction of a cent.

## Acceptance criteria (EARS)

| AC-ID | Pattern | Criterion | How it is checked |
|---|---|---|---|
| AC-01 | ubiquitous | The system shall return order totals rounded to two decimal places. | See Test plan |
| AC-02 | event-driven | WHEN an item list is empty, the system shall return 0. | See Test plan |

## Edge cases

- An empty list. Covered by AC-02.

## Design analysis

No user interface. `total()` is called by the receipt renderer; the rounding
happens at the boundary where the number becomes money.

## Non-functional requirements

| Limit | Value | Why this number |
|---|---|---|
| none | — | — |

## Inputs and provenance

| Input | Where it comes from | When it is stale | If missing |
|---|---|---|---|
| `items` | the caller | never | treated as empty |

## Untrusted inputs

none — nothing new reaches a prompt in this change.

## Test plan

| Lane | Covers |
|---|---|
| whatever this repository declares | AC-01, AC-02 |

**Deliberately not covered by an automated test:** nothing.

## Risks

| Risk | How we would notice | What we do |
|---|---|---|
| Rounding hides an upstream pricing bug | totals drift from the sum of line items | keep the unrounded value in logs |

## Open questions

none.
