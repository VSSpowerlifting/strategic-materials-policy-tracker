"""Compare a built or downloaded markets CSV with the pinned observations."""

import csv
import json
import sys
from pathlib import Path


def main(csv_path: Path) -> int:
    markets = Path(__file__).resolve().parents[1] / "data" / "markets"
    expected = {}
    for path in sorted(markets.glob("*/observations.json")):
        # Keep the decimal spelling in the source independent of JS parsing.
        observations = json.loads(
            path.read_text(encoding="utf-8"), parse_float=str, parse_int=str
        )["observations"]
        for series_id, rows in observations.items():
            for row in rows:
                key = (path.parent.name, series_id, row["period"])
                if key in expected:
                    raise ValueError(f"Duplicate pinned observation: {key}")
                expected[key] = row["value"]
    if not expected:
        raise ValueError("No pinned market observations found")

    seen = set()
    differences = []
    with csv_path.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream, strict=True):
            key = (row["dataset_id"], row["series_id"], row["period"])
            if key in seen:
                differences.append(f"{key}: duplicate CSV row")
            elif key not in expected:
                differences.append(f"{key}: unexpected CSV row")
            elif row["value"] != expected[key]:
                differences.append(f"{key}: expected {expected[key]}, got {row['value']}")
            seen.add(key)
    differences.extend(f"{key}: missing CSV row" for key in sorted(expected.keys() - seen))

    for difference in differences:
        print(difference, file=sys.stderr)
    print(f"Market CSV parity: {len(differences)} differences across {len(expected):,} pinned observations")
    return int(bool(differences))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(f"Usage: {sys.argv[0]} <markets.csv>")
    sys.exit(main(Path(sys.argv[1])))
