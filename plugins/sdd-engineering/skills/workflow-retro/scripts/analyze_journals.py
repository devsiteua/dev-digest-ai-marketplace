#!/usr/bin/env python3
"""Aggregate token usage out of Claude Code JSONL journals, one row per file.

One file is one agent launch, so summing a directory into a single number hides
the thing worth knowing: which agent spent the money. This prints a row per file
and one total, and nothing else — the journals themselves are transcripts and
will not fit in a model's context.

Invoked from the workflow-retro skill as:

    python3 "${CLAUDE_SKILL_DIR}/scripts/analyze_journals.py" <path> [more...]

Each <path> is a .jsonl journal or a directory of them. Reads only; writes
nothing anywhere, and sends nothing off the machine.

    --json      emit machine-readable output instead of the table
    --by-model  break each file down by the model its turns ran on
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

FIELDS = (
    "input_tokens",
    "output_tokens",
    "cache_creation_input_tokens",
    "cache_read_input_tokens",
)


def blank() -> dict:
    return {"turns": 0, **{f: 0 for f in FIELDS}}


def read_journal(path: Path) -> tuple[dict, dict, list[str]]:
    """Return (totals, per-model totals, problems) for one .jsonl journal."""
    totals = blank()
    by_model: dict[str, dict] = defaultdict(blank)
    problems: list[str] = []

    with path.open(encoding="utf-8", errors="replace") as handle:
        for lineno, line in enumerate(handle, 1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                problems.append(f"line {lineno}: not JSON")
                continue

            message = record.get("message")
            if not isinstance(message, dict):
                continue
            usage = message.get("usage")
            if not isinstance(usage, dict):
                continue

            model = message.get("model") or "unknown"
            totals["turns"] += 1
            by_model[model]["turns"] += 1
            for field in FIELDS:
                value = usage.get(field) or 0
                if not isinstance(value, int):
                    continue
                totals[field] += value
                by_model[model][field] += value

    return totals, dict(by_model), problems


def collect(paths: list[str]) -> tuple[list[tuple[Path, dict, dict]], list[str]]:
    rows: list[tuple[Path, dict, dict]] = []
    problems: list[str] = []

    for raw in paths:
        path = Path(raw).expanduser()
        if path.is_dir():
            files = sorted(path.rglob("*.jsonl"))
            if not files:
                problems.append(f"{path}: no .jsonl files")
        elif path.is_file():
            files = [path]
        else:
            problems.append(f"{path}: not found")
            continue

        for file in files:
            totals, by_model, file_problems = read_journal(file)
            problems.extend(f"{file}: {p}" for p in file_problems)
            rows.append((file, totals, by_model))

    return rows, problems


def thousands(value: int) -> str:
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if value >= 1_000:
        return f"{value / 1_000:.1f}k"
    return str(value)


def print_table(rows, by_model: bool) -> None:
    header = ("journal", "turns", "input", "output", "cache write", "cache read")
    widths = [max(28, *(len(r[0].name) for r in rows)) if rows else 28, 6, 10, 10, 12, 12]

    def line(cells) -> str:
        return "  ".join(
            str(cell).ljust(width) if i == 0 else str(cell).rjust(width)
            for i, (cell, width) in enumerate(zip(cells, widths))
        )

    print(line(header))
    print("  ".join("-" * w for w in widths))

    grand = blank()
    for path, totals, models in rows:
        print(
            line(
                (
                    path.name,
                    totals["turns"],
                    thousands(totals["input_tokens"]),
                    thousands(totals["output_tokens"]),
                    thousands(totals["cache_creation_input_tokens"]),
                    thousands(totals["cache_read_input_tokens"]),
                )
            )
        )
        if by_model:
            for model, m in sorted(models.items()):
                print(
                    line(
                        (
                            f"  {model}",
                            m["turns"],
                            thousands(m["input_tokens"]),
                            thousands(m["output_tokens"]),
                            thousands(m["cache_creation_input_tokens"]),
                            thousands(m["cache_read_input_tokens"]),
                        )
                    )
                )
        grand["turns"] += totals["turns"]
        for field in FIELDS:
            grand[field] += totals[field]

    print("  ".join("-" * w for w in widths))
    print(
        line(
            (
                f"TOTAL ({len(rows)} journals)",
                grand["turns"],
                thousands(grand["input_tokens"]),
                thousands(grand["output_tokens"]),
                thousands(grand["cache_creation_input_tokens"]),
                thousands(grand["cache_read_input_tokens"]),
            )
        )
    )
    print()
    print("Cache reads are not the same money as fresh input. Report them separately.")
    print("One journal is one agent launch; the per-file rows are the answer, not the total.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Aggregate token usage from Claude Code JSONL journals, one row per file."
    )
    parser.add_argument("paths", nargs="+", help=".jsonl journal files, or directories of them")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of a table")
    parser.add_argument("--by-model", action="store_true", help="break each file down by model")
    args = parser.parse_args()

    rows, problems = collect(args.paths)

    if not rows:
        for problem in problems:
            print(f"warning: {problem}", file=sys.stderr)
        print("No journals read. Nothing to analyse — say so rather than estimating.", file=sys.stderr)
        return 1

    if args.json:
        print(
            json.dumps(
                {
                    "journals": [
                        {"path": str(p), "totals": t, "by_model": m} for p, t, m in rows
                    ],
                    "problems": problems,
                },
                indent=2,
            )
        )
    else:
        print_table(rows, args.by_model)
        for problem in problems:
            print(f"warning: {problem}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
