"""Import and query a Controls snapshot using only the Python standard library."""

from collections import defaultdict
from datetime import date, timedelta
from hashlib import sha256
from json import loads
from pathlib import Path


RESTRICTIONS = {
    "export_licensing", "export_prohibition",
    "extraterritorial_licensing", "end_use_restriction",
}
POST_2024 = "2025-01-01"
EXAMPLE_AS_OF = "2026-11-12"


def index(rows, key):
    result = {}
    for row in rows:
        identity = key(row)
        assert identity not in result, f"Duplicate key {identity}"
        result[identity] = row
    return result


class Snapshot:
    def __init__(self, folder):
        manifest = loads((folder / "manifest.json").read_text(encoding="utf-8"))
        assert manifest["schemaVersion"] == 1
        self.as_of = manifest["asOf"]

        def read(name):
            payload = (folder / name).read_bytes()
            metadata = manifest["datasets"][name]
            assert sha256(payload).hexdigest() == metadata["sha256"], name
            rows = loads(payload)
            assert len(rows) == metadata["rows"], name
            return rows

        self.clauses = index(read("control-clauses.json"), lambda row: row["id"])
        self.events = index(read("policy-events.json"), lambda row: row["id"])
        self.sources = index(read("sources.json"), lambda row: row["id"])
        status_rows = read("control-status-history.json")
        history = index(status_rows, lambda row: (row["measureId"], row["sequence"]))
        self.history = defaultdict(list)
        for (clause_id, sequence), row in sorted(history.items()):
            clause = self.clauses[clause_id]
            assert sequence == len(self.history[clause_id])
            assert any(ref["sourceId"] == row["sourceId"] and "status" in ref["supports"]
                       for ref in clause["evidence"]), row
            self.history[clause_id].append(row)

        for clause in self.clauses.values():
            parent = self.events[clause["eventId"]]
            assert clause["issuer"] == parent["jurisdiction"]
            assert clause["evidence"] and self.history[clause["id"]]
            for event_id in clause["legalBasisEventIds"]:
                assert event_id in self.events
            for modified_id in clause["modifiesMeasureIds"]:
                assert modified_id in self.clauses
            for ref in clause["evidence"]:
                assert ref["sourceId"] in self.sources
            dates = [row["date"] for row in self.history[clause["id"]] if row["date"]]
            assert dates == sorted(dates), clause["id"]
            for row in self.history[clause["id"]]:
                assert not row.get("until") or row["date"] <= row["until"], row

        for event in self.events.values():
            assert event["sourceIds"] and all(s in self.sources for s in event["sourceIds"])
            successor = event["supersededByEventId"]
            assert successor is None or successor in self.events
        for source in self.sources.values():
            assert source["url"].startswith(("https://", "http://")), source["id"]

    def check_date(self, day):
        if date.fromisoformat(day).isoformat() != day or day > self.as_of:
            raise ValueError(f"Use a YYYY-MM-DD query date through {self.as_of}")

    def recorded_status(self, clause_id, day):
        """Evaluate dated evidence, including boundary tests after the snapshot cutoff."""
        entry = None
        for row in self.history[clause_id]:
            if row["date"] is None:
                if entry is not None:
                    entry = row
                continue
            if row["date"] > day:
                break
            entry = row
        if entry is None:
            return "no_dated_status", None
        if entry["date"] is None:
            return "undated_status", entry
        if entry.get("until") and day > entry["until"]:
            return "stated_window_passed", entry
        return entry["status"], entry

    def restriction(self, clause):
        return (clause["direction"] in {"export", "re_export"}
                and clause["measureType"] in RESTRICTIONS
                and self.events[clause["eventId"]]["verificationStatus"] == "verified")

    def first_effect(self, clause_id):
        return next((row for row in self.history[clause_id]
                     if row["status"] == "in_force" and row["date"]), None)

    def introduced(self, start, end):
        """Find clauses with their first dated in_force entry in an inclusive window."""
        self.check_date(start)
        self.check_date(end)
        if start > end:
            raise ValueError("Start date must precede or equal end date")
        for clause in self.clauses.values():
            first = self.first_effect(clause["id"])
            if self.restriction(clause) and first and start <= first["date"] <= end:
                yield clause, first

    def destination_matches(self, material, destination, day):
        """Return dated restriction records and their scope match for further review."""
        self.check_date(day)
        for clause in self.clauses.values():
            if not self.restriction(clause):
                continue
            scopes = set(clause["targetScopes"])
            named = "named_jurisdictions" in scopes
            global_scope = "all_jurisdictions" in scopes
            if named and destination not in clause["targetJurisdictions"] and not global_scope:
                continue
            if material not in clause["materialIds"]:
                if clause["materialIds"] and clause["materialAttribution"] == "tracked_only":
                    continue
                match = "material_scope_requires_review"
            elif ((global_scope or named)
                  and scopes <= {"all_jurisdictions", "named_jurisdictions"}):
                match = "material_and_destination_coded"
            else:
                match = "destination_or_transaction_scope_requires_review"
            status, entry = self.recorded_status(clause["id"], day)
            if status != "no_dated_status":
                yield clause, match, status, entry

    def has_explicit_official_status(self, clause, entry):
        source = self.sources[entry["sourceId"]]
        return (source["sourceType"] == "official" and source["confidence"] == "primary"
                and any(ref["sourceId"] == entry["sourceId"] and "status" in ref["supports"]
                        and ref["evidence"] == "explicit" for ref in clause["evidence"]))

    def show(self, clause, entry):
        event = self.events[clause["eventId"]]
        first = self.first_effect(clause["id"])
        print(f'  {clause["id"]} | {event["id"]} | {event["documentLabel"]}')
        print(f'    {clause["clause"] or "whole clause"} | {entry["status"]} from {entry["date"]}'
              + (f' through {entry["until"]}' if entry.get("until") else ""))
        # Keep the dated receipt separate from sources that establish the scope
        # or introduction. A later evidence citation does not set past status.
        source_ids = {entry["sourceId"]}
        if first and (not entry["date"] or first["date"] <= entry["date"]):
            source_ids.add(first["sourceId"])
        citations = set()
        for ref in clause["evidence"]:
            source = self.sources[ref["sourceId"]]
            if ref["sourceId"] in source_ids or set(ref["supports"]) - {"status"}:
                citations.add((source["id"], source["sourceType"], source["confidence"],
                               ref["evidence"], ref.get("locator") or "(no pinpoint)", source["url"]))
        for source_id, source_type, confidence, strength, locator, url in sorted(citations):
            print(f"    {source_id} [{source_type}/{confidence}, {strength}] {locator} | {url}")


def verify_boundaries(snapshot):
    """Verify real boundary cases and that the affecting source changed exactly the coded limbs."""
    def status(clause_id, day):
        state, entry = snapshot.recorded_status(clause_id, day)
        return state, entry and entry["sourceId"]

    graphite = "ctl-cn-graphite-2023-export-licensing"
    assert status(graphite, "2023-11-30")[0] == "scheduled"
    assert status(graphite, "2023-12-01") == ("in_force", "src-mofcom-39")

    older = "ctl-cn-58-2025-graphite-anode-licensing"
    newer = "ctl-cn-ree-2026-11-suspension-continuation"
    old_event, new_event = (snapshot.events[snapshot.clauses[row]["eventId"]] for row in (older, newer))
    assert "No. 58 of 2025" in old_event["documentLabel"]
    assert "No. 58 of 2026" in new_event["documentLabel"]
    assert status(older, "2025-11-06")[0] == "scheduled"
    assert status(older, "2025-11-07") == ("suspended", "src-mofcom-70")
    assert status(older, "2025-11-08")[0] == "suspended"
    assert status(older, "2026-11-10") == ("suspended", "src-mofcom-70")
    assert status(older, "2026-11-11") == ("suspended", "src-mofcom-2026-58")
    assert status(older, "2027-01-10")[0] == "suspended"
    assert status(older, "2027-01-11")[0] == "stated_window_passed"
    assert status(newer, "2026-11-10")[0] == "scheduled"
    assert status(newer, "2026-11-11") == ("in_force", "src-mofcom-2026-58")
    assert snapshot.first_effect(older) is None
    continued = {clause_id for clause_id in snapshot.clauses
                 if status(clause_id, "2026-11-11") == ("suspended", "src-mofcom-2026-58")}
    umbrella = "ctl-cn-ree-2025-11-suspension"
    linked = set(snapshot.clauses[newer]["modifiesMeasureIds"]) - {umbrella}
    assert linked <= continued
    # No. 55 rows are source-linked. Main still names the instrument as external
    # on the suspension records, so test the exception without inventing edges.
    assert all(snapshot.clauses[id_]["eventId"] == "evt-cn-mofcom-55-2025"
               for id_ in continued - linked)
    print(f"2026 No. 58 continued {len(continued)} clause suspensions; "
          f"{len(continued - linked)} have no modifiesMeasureIds edge.")

    partial = {
        "ctl-cn-us-2024-gallium-germanium-antimony-denial",
        "ctl-cn-us-2024-graphite-end-use-review",
    }
    changed = {clause_id for clause_id in snapshot.clauses
               if status(clause_id, "2025-11-08")[0] != status(clause_id, "2025-11-09")[0]}
    assert changed == partial
    for clause_id in partial:
        assert status(clause_id, "2025-11-08") == ("in_force", "src-mofcom-46")
        assert status(clause_id, "2025-11-09") == ("suspended", "src-mofcom-72")
        assert status(clause_id, "2026-11-27") == ("suspended", "src-mofcom-72")
        assert status(clause_id, "2026-11-28")[0] == "stated_window_passed"
    military = "ctl-cn-us-2024-military-end-use-ban"
    assert status(military, "2025-11-09") == ("in_force", "src-mofcom-46")

    for start, end in (("2025-11-07", "2025-11-09"), ("2026-11-09", "2026-11-11")):
        assert not list(snapshot.introduced(start, end))
    try:
        day_after_cutoff = date.fromisoformat(snapshot.as_of) + timedelta(days=1)
        list(snapshot.destination_matches("graphite", "US", day_after_cutoff.isoformat()))
    except ValueError:
        pass
    else:
        raise AssertionError("Accepted a query beyond the snapshot cutoff")


def main():
    snapshot = Snapshot(Path(__file__).resolve().parent)
    verify_boundaries(snapshot)
    introduced = list(snapshot.introduced(POST_2024, EXAMPLE_AS_OF))
    explicit = [(clause, entry) for clause, entry in introduced
                if snapshot.has_explicit_official_status(clause, entry)]
    groups = defaultdict(list)
    for clause, _ in introduced:
        for material in clause["materialIds"] or ["(no tracked material coded)"]:
            groups[clause["issuer"], material, clause["measureType"]].append(clause["id"])
    instrument_ids = {row["eventId"] for row, _ in introduced}
    print(f"First recorded in force {POST_2024} through {EXAMPLE_AS_OF}: "
          f"{len(introduced)} distinct clauses, {len(instrument_ids)} distinct instruments")
    print(f"With explicit official primary status evidence: {len(explicit)} clauses, "
          f"{len({clause['eventId'] for clause, _ in explicit})} instruments")
    print("Issuing jurisdiction | material | measure type | clause count | clause IDs")
    for group, ids in sorted(groups.items()):
        print(" | ".join((*group, str(len(ids)), ", ".join(sorted(ids)))))
    for clause, entry in introduced:
        snapshot.show(clause, entry)

    for day in ("2025-11-08", "2025-11-09", EXAMPLE_AS_OF):
        matched = list(snapshot.destination_matches("graphite", "US", day))
        active = {clause["id"] for clause, match, status, entry in matched
                  if match == "material_and_destination_coded" and status == "in_force"
                  and snapshot.has_explicit_official_status(clause, entry)}
        expected = {"ctl-cn-graphite-2023-export-licensing"}
        if day == "2025-11-08":
            expected.add("ctl-cn-us-2024-graphite-end-use-review")
        assert active == expected, day
        instrument_ids = {snapshot.clauses[clause_id]["eventId"] for clause_id in active}
        print(f"Graphite to US on {day}: {len(active)} coded in-force clause(s), "
              f"{len(instrument_ids)} distinct instrument(s)")
        for clause_id in sorted(active):
            snapshot.show(snapshot.clauses[clause_id], snapshot.recorded_status(clause_id, day)[1])
        for clause, match, status, entry in matched:
            if status == "in_force" and clause["id"] not in active:
                print(f'  Review {clause["id"]} | {match} | status evidence '
                      f'{entry["sourceId"]} | {snapshot.sources[entry["sourceId"]]["url"]}')

    print("Suspension and scope evidence (outside the in-force graphite count)")
    older = "ctl-cn-58-2025-graphite-anode-licensing"
    snapshot.show(snapshot.clauses[older], snapshot.recorded_status(older, "2026-11-10")[1])
    for clause_id in (
        "ctl-cn-58-2025-graphite-anode-licensing",
        "ctl-cn-ree-2026-11-suspension-continuation",
        "ctl-cn-us-2024-gallium-germanium-antimony-denial",
        "ctl-cn-us-2024-graphite-end-use-review",
        "ctl-cn-us-2024-military-end-use-ban",
    ):
        snapshot.show(snapshot.clauses[clause_id], snapshot.recorded_status(clause_id, EXAMPLE_AS_OF)[1])


if __name__ == "__main__":
    main()
