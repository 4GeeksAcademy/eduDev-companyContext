#!/usr/bin/env python3
"""Run the TrackFlow incident CSV analyzer from the command line."""

from __future__ import annotations

import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from shared.incident_analysis import (  # noqa: E402
    IncidentAnalysisError,
    REASON_LABELS,
    analyze_csv_file,
    results_to_csv,
)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python analyze.py <csv-path>", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    if not source.is_file():
        print(f"Error: CSV file not found: {source}", file=sys.stderr)
        return 2

    try:
        summary = analyze_csv_file(source)
    except UnicodeDecodeError:
        print("Error: The CSV file must use valid UTF-8 encoding.", file=sys.stderr)
        return 2
    except (IncidentAnalysisError, OSError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 2

    print_report(summary, source.name)
    if _confirm_export():
        try:
            Path.cwd().joinpath("results.csv").write_text(
                results_to_csv(summary), encoding="utf-8", newline=""
            )
        except OSError as error:
            print(f"Error: Could not write results.csv: {error}", file=sys.stderr)
            return 2
        print("Aggregate results exported to results.csv.")
    return 0


def print_report(summary: dict, source_name: str) -> None:
    valid = summary["valid_records"]
    satisfaction = summary["satisfaction"]
    print("=" * 60)
    print("  TRACKFLOW — INCIDENT REPORT ANALYSIS")
    print(f"  Source file: {source_name}")
    print("=" * 60)
    print(f"\nTOTAL RECORDS IN FILE .......... {summary['total_records']}")
    print(f"  Valid records ................ {valid}")
    print(f"  Invalid / incomplete ......... {summary['invalid_records']}")

    print("\nINVALID RECORDS BREAKDOWN")
    for key, label in REASON_LABELS.items():
        if summary["invalid_reasons"][key]:
            print(f"  {label:<38} {summary['invalid_reasons'][key]}")

    _print_breakdown("CATEGORY", summary["categories"], valid)
    _print_breakdown("STATUS", summary["statuses"], valid)
    _print_breakdown("COUNTRY", summary["countries"], valid)

    average = satisfaction["average"]
    average_text = f"{average:.2f}" if average is not None else "N/A"
    print("\nSATISFACTION INDEX (closed incidents)")
    print(
        f"  Scored incidents: {satisfaction['scored_incidents']} "
        f"of {satisfaction['closed_incidents']}"
    )
    print(f"  Average score: {average_text} / 5.00")
    for score, count in satisfaction["scores"].items():
        print(f"  Score {score:<28} {count}")
    print(f"\n{'=' * 60}")


def _print_breakdown(title: str, values: dict[str, int], valid: int) -> None:
    print(f"\nBREAKDOWN BY {title} (valid records)")
    for label, count in values.items():
        percentage = count / valid * 100 if valid else 0
        print(f"  {label:<30} {count:>3}  ({percentage:.1f}%)")


def _confirm_export() -> bool:
    while True:
        answer = input("Export results to CSV? [y / n]:").strip().lower()
        if answer in {"y", "n"}:
            return answer == "y"
        print("Please enter y or n.")


if __name__ == "__main__":
    raise SystemExit(main())
