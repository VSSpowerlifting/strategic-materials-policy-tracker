#!/usr/bin/env python3
"""Reference consumer for the Stratellar Controls integration feed.

What this file shows
  1. How to check a release directory before trusting it: file hashes, row
     counts, the release identity, the profile version, every row against
     profile.json, and every join between the six datasets.
  2. How to keep releases side by side in sqlite so that an old answer can be
     reproduced after a newer release arrives.
  3. How to compare two stored releases by key and row hash, and how to cite
     the source behind each new or changed status entry.
  4. How to replay the record: the standing of a clause on a day, the clauses
     coded for a material and destination, and what a period introduced.

It is written from the feed's documented contract (manifest.json, profile.json
and the row fields). It does not call the publisher's code. It uses the Python
standard library only and runs on Python 3.9 or later.

This is a reference, not a compliance tool. A match is a research
classification of the public record. It does not decide whether a shipment is
controlled; the wording at the cited sources governs.

Commands (JSON on stdout; a refusal prints one line on stderr and exits 1)
  load <feed-dir> --db <file>
  releases --db <file>
  diff --db <file> --from <releaseId> --to <releaseId>
  query --db <file> --release <releaseId|latest> --material <id>
        --destination <CC> --on <date> [--issuer <id>] [--vintage <date>]
        [--include-pending]
  standing --db <file> --release <releaseId|latest> --measure <id> --on <date>
        [--vintage <date>] [--include-pending]
  counts --db <file> --release <releaseId|latest> --start <date> --end <date>
        [--vintage <date>] [--include-pending]
  batch --db <file> [--requests <file>]
        Runs a JSON list of query, standing, counts and diff requests in one
        process. Reads the list from stdin unless --requests names a file.

"latest" means the release loaded most recently into this database.
"""

import argparse
import hashlib
import json
import sqlite3
import sys
from pathlib import Path


# --------------------------------------------------------------------------
# 1. Contract constants
# --------------------------------------------------------------------------

FEED_NAME = "stratellar-controls-integration"
SUPPORTED_PROFILE_MAJOR = "1"
# A producer cannot expand the loader's rights allowlist by repackaging profile.json.
REVIEWED_PROFILES = {"1.0.0": "5f1338d40332c440e05b1bf3a060b43b0f9591838c4620f0bbda62bc87a0cc02"}
RELEASE_ID_PREFIX = "stratellar-controls-feed-p" + SUPPORTED_PROFILE_MAJOR + "-"

# The six datasets of profile major version 1, in the order the manifest lists them.
DATASET_FILES = (
    "instruments.json",
    "instrument-dates.json",
    "measures.json",
    "status-entries.json",
    "evidence.json",
    "sources.json",
)

PUBLISHED = "published"
PUBLISHED_RECORD = "published_record"

NOTICE = (
    "Research classification of the public record. A match, a product code or an "
    "absence of rows is not a determination that a shipment is or is not controlled; "
    "the wording at the cited sources governs."
)

# Clauses the worked example treats as restrictions on an outbound flow.
OUTBOUND_DIRECTIONS = ("export", "re_export")
RESTRICTION_TYPES = (
    "export_licensing",
    "export_prohibition",
    "extraterritorial_licensing",
    "end_use_restriction",
)

SCHEMA_VERSION = 1
SCHEMA = (
    """CREATE TABLE releases (
         release_id      TEXT PRIMARY KEY,
         load_seq        INTEGER NOT NULL UNIQUE,
         manifest_json   TEXT NOT NULL,
         manifest_sha256 TEXT NOT NULL
       )""",
    """CREATE TABLE release_documents (
         release_id TEXT NOT NULL REFERENCES releases(release_id),
         name       TEXT NOT NULL,
         content    TEXT NOT NULL,
         sha256     TEXT NOT NULL,
         PRIMARY KEY (release_id, name)
       )""",
    """CREATE TABLE release_rows (
         release_id TEXT NOT NULL REFERENCES releases(release_id),
         dataset    TEXT NOT NULL,
         row_index  INTEGER NOT NULL,
         row_key    TEXT NOT NULL,
         row_json   TEXT NOT NULL,
         row_sha256 TEXT NOT NULL,
         PRIMARY KEY (release_id, dataset, row_key)
       )""",
)
IMMUTABLE_TABLES = ("releases", "release_documents", "release_rows")


class ConsumerError(Exception):
    """A refusal. The message is printed on one line after "consumer: "."""


def fail(message):
    raise ConsumerError(message)


# --------------------------------------------------------------------------
# 2. JSON and hashing
# --------------------------------------------------------------------------

def sha256_hex(data):
    return hashlib.sha256(data).hexdigest()


def stable_json(value):
    """The publisher's serialisation: two-space JSON, keys in the order given, one final newline."""
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def canonical_json(value):
    """A compact form with sorted keys, used only to hash and compare rows."""
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def parse_json(text, name):
    """Parse JSON strictly: no repeated member names, no NaN or Infinity."""

    def members(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                fail('%s repeats the member name "%s"' % (name, key))
            result[key] = value
        return result

    def constant(token):
        fail("%s holds %s, which is not JSON" % (name, token))

    try:
        return json.loads(text, object_pairs_hook=members, parse_constant=constant)
    except ValueError as error:
        fail("%s is not valid JSON (%s)" % (name, error))


def read_file(path, name):
    """Return (bytes, text) of a release file. The hash is taken over the bytes."""
    try:
        raw = path.read_bytes()
    except OSError as error:
        fail("cannot read %s (%s)" % (name, error.strerror or error))
    try:
        return raw, raw.decode("utf-8")
    except UnicodeDecodeError:
        fail("%s is not UTF-8" % name)


# --------------------------------------------------------------------------
# 3. Value rules of profile major version 1
# --------------------------------------------------------------------------

LOWER_ALNUM = "abcdefghijklmnopqrstuvwxyz0123456789"
ASCII_ALNUM = LOWER_ALNUM + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
DIGITS = "0123456789"
DAYS_IN_MONTH = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)

# Line and paragraph separators are written as code points on purpose.
CONTROL_CHARACTERS = frozenset([chr(code) for code in range(0x20)] + [chr(0x7F), chr(0x2028), chr(0x2029)])
WHITESPACE = frozenset(
    [chr(code) for code in (0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0xA0, 0x1680, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF)]
    + [chr(code) for code in range(0x2000, 0x200B)]
)


def utf16_length(text):
    """Length as the publisher counts it (UTF-16 code units)."""
    return len(text.encode("utf-16-le", "surrogatepass")) // 2


def is_calendar_date(value):
    if not isinstance(value, str) or len(value) != 10 or value[4] != "-" or value[7] != "-":
        return False
    if any(ch not in DIGITS for ch in value[:4] + value[5:7] + value[8:]):
        return False
    year, month, day = int(value[:4]), int(value[5:7]), int(value[8:])
    if month < 1 or month > 12 or day < 1:
        return False
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    return day <= (29 if leap and month == 2 else DAYS_IN_MONTH[month - 1])


def is_id(value):
    return (
        isinstance(value, str)
        and 0 < len(value) <= 120
        and value[0] in LOWER_ALNUM
        and all(ch in LOWER_ALNUM or ch == "-" for ch in value)
    )


def is_code(value):
    return (
        isinstance(value, str)
        and 0 < len(value) <= 32
        and value[0] in ASCII_ALNUM
        and all(ch in ASCII_ALNUM or ch in ".-" for ch in value)
    )


def is_country(value):
    return isinstance(value, str) and len(value) == 2 and all(ch in UPPER for ch in value)


def is_url(value):
    if not isinstance(value, str) or utf16_length(value) > 400:
        return False
    rest = value[8:] if value.startswith("https://") else value[7:] if value.startswith("http://") else ""
    return rest != "" and not any(ch in WHITESPACE or ch in CONTROL_CHARACTERS for ch in value)


def is_identifier_text(value, max_length):
    return (
        isinstance(value, str)
        and value != ""
        and value[0] not in WHITESPACE
        and value[-1] not in WHITESPACE
        and utf16_length(value) <= max_length
        and not any(ch in CONTROL_CHARACTERS for ch in value)
    )


def is_count(value):
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def compile_rule(field, registers, where):
    """Turn one profile field into {"test", "label", "nullable"}. An unknown rule type is refused."""
    kind = field.get("type")
    nullable = field.get("nullable") is True
    if kind == "id":
        test = is_id
    elif kind == "date":
        test = is_calendar_date
    elif kind == "boolean":
        test = lambda value: isinstance(value, bool)
    elif kind == "count":
        test = is_count
    elif kind == "url":
        test = is_url
    elif kind == "country":
        test = is_country
    elif kind == "code":
        test = is_code
    elif kind == "enum":
        values = field.get("values")
        if not isinstance(values, list) or not all(isinstance(item, str) for item in values):
            fail("%s: an enum field lists no values" % where)
        allowed = frozenset(values)
        test = lambda value: isinstance(value, str) and value in allowed
    elif kind == "identifier":
        max_length = field.get("maxLength")
        if not is_count(max_length):
            fail("%s: an identifier field states no maxLength" % where)
        test = lambda value: is_identifier_text(value, max_length)
        kind = "identifier, at most %d characters" % max_length
    elif kind == "register":
        register = registers.get(field.get("register")) if isinstance(registers, dict) else None
        if not isinstance(register, list):
            fail('%s: register "%s" is not in profile.json' % (where, field.get("register")))
        approved = frozenset(item for item in register if isinstance(item, str))
        test = lambda value: isinstance(value, str) and value in approved
        kind = "register %s" % field.get("register")
    else:
        fail('%s: rule type "%s" is not known to this loader; update the loader before loading' % (where, kind))
    return {"test": test, "label": kind, "nullable": nullable}


# --------------------------------------------------------------------------
# 4. Rows against the profile
# --------------------------------------------------------------------------

def build_schema(dataset, fields, registers):
    """Build a tree from the flat path list.

    "issuer" is a value, "mechanism[]" a list of values and
    "productCodes[].code" a value inside a list of objects. Each node is
    {"list": bool, "rule": rule or None, "children": dict or None}.
    """
    root = {}
    if not isinstance(fields, list) or not fields:
        fail("profile.json lists no fields for %s" % dataset)
    for field in fields:
        path = field.get("path") if isinstance(field, dict) else None
        where = 'profile.json %s field "%s"' % (dataset, path)
        if not isinstance(path, str) or path == "":
            fail("profile.json %s has a field without a path" % dataset)
        steps = path.split(".")
        children = root
        for depth, step in enumerate(steps):
            is_list = step.endswith("[]")
            name = step[:-2] if is_list else step
            if name == "" or "[" in name or "]" in name:
                fail("%s: this loader cannot read the path" % where)
            last = depth == len(steps) - 1
            node = children.get(name)
            if node is None:
                node = {"list": is_list, "rule": None, "children": None if last else {}}
                children[name] = node
            if node["list"] != is_list or (last and node["children"] is not None) or (not last and node["rule"] is not None):
                fail("%s: the path conflicts with another field" % where)
            if last:
                if node["rule"] is not None:
                    fail("%s: the path is listed twice" % where)
                node["rule"] = compile_rule(field, registers, where)
            else:
                children = node["children"]
    return root


def check_object(children, value, prefix, where):
    """Check one object positively: every member must be listed, every listed member present."""
    for name in value:
        if name not in children:
            fail('%s: field "%s%s" is not in the integration profile' % (where, prefix, name))
    for name, node in children.items():
        path = prefix + name + ("[]" if node["list"] else "")
        if name not in value:
            fail('%s: required field "%s" is missing' % (where, path))
        member = value[name]
        if node["list"]:
            if not isinstance(member, list):
                fail('%s: "%s" must be an array' % (where, path))
            for position, item in enumerate(member):
                check_item(node, item, path, "%s, item %d" % (where, position))
        else:
            check_item(node, member, path, where)


def check_item(node, item, path, where):
    if node["children"] is not None:
        if not isinstance(item, dict):
            fail('%s: "%s" must be an object' % (where, path))
        check_object(node["children"], item, path + ".", where)
        return
    rule = node["rule"]
    if item is None:
        if not rule["nullable"]:
            fail('%s: "%s" must not be null' % (where, path))
        return
    if isinstance(item, (dict, list)):
        fail('%s: "%s" must be a single value' % (where, path))
    if not rule["test"](item):
        fail('%s: "%s" holds a value its rule (%s) does not allow' % (where, path, rule["label"]))


def validate_rows(profile, manifest, rows):
    """Validate every row of every dataset against profile.json. Returns nothing; refuses on the first break."""
    datasets = profile.get("datasets")
    if not isinstance(datasets, dict) or sorted(datasets) != sorted(DATASET_FILES):
        fail("profile.json does not describe exactly the six datasets of profile version 1")
    for dataset in DATASET_FILES:
        description = datasets[dataset]
        key = description.get("key") if isinstance(description, dict) else None
        if key != manifest["datasets"][dataset].get("key"):
            fail("%s: profile.json and manifest.json name different keys" % dataset)
        schema = build_schema(dataset, description.get("fields"), profile.get("registers"))
        key_node = schema.get(key)
        if key_node is None or key_node["list"] or key_node["rule"] is None or key_node["rule"]["nullable"]:
            fail('%s: key "%s" is not a required single value in profile.json' % (dataset, key))
        seen = set()
        for index, row in enumerate(rows[dataset]):
            where = "%s row %d" % (dataset, index)
            if not isinstance(row, dict):
                fail("%s is not an object" % where)
            check_object(schema, row, "", where)
            if row[key] in seen:
                fail("%s: duplicate key %s" % (dataset, row[key]))
            seen.add(row[key])


# --------------------------------------------------------------------------
# 5. Joins between the datasets
# --------------------------------------------------------------------------

def check_references(rows):
    """Every identifier a row points at must exist in the same release."""
    instruments = {row["instrumentId"]: row for row in rows["instruments.json"]}
    measures = {row["measureId"]: row for row in rows["measures.json"]}
    sources = {row["sourceId"]: row for row in rows["sources.json"]}

    def need(known, value, what):
        if value not in known:
            fail('%s refers to "%s", which the release does not contain' % (what, value))

    for row in rows["instruments.json"]:
        what = "instrument %s" % row["instrumentId"]
        for source_id in row["sourceIds"]:
            need(sources, source_id, what)
        if row["supersededByInstrumentId"] is not None:
            need(instruments, row["supersededByInstrumentId"], what)

    for row in rows["instrument-dates.json"]:
        what = "instrument-dates %s" % row["instrumentId"]
        need(instruments, row["instrumentId"], what)
        need(sources, row["sourceId"], what)

    for row in rows["measures.json"]:
        what = "measure %s" % row["measureId"]
        need(instruments, row["instrumentId"], what)
        for instrument_id in row["legalBasisInstrumentIds"]:
            need(instruments, instrument_id, what)
        for measure_id in row["modifiesMeasureIds"]:
            need(measures, measure_id, what)
        for limitation in row["limitations"]:
            for source_id in limitation["sourceIds"]:
                need(sources, source_id, what)

    status_support = set()
    cited = set()
    for row in rows["evidence.json"]:
        what = "evidence %s" % row["evidenceId"]
        need(measures, row["measureId"], what)
        need(sources, row["sourceId"], what)
        cited.add(row["measureId"])
        if "status" in row["supports"]:
            status_support.add((row["measureId"], row["sourceId"]))

    dated = set()
    with_status = set()
    for row in rows["status-entries.json"]:
        what = "status entry %s" % row["entryId"]
        need(measures, row["measureId"], what)
        need(sources, row["sourceId"], what)
        with_status.add(row["measureId"])
        if (row["measureId"], row["sourceId"]) not in status_support:
            fail("%s cites %s, but no evidence row for that clause and source supports the status" % (what, row["sourceId"]))
        published_on = sources[row["sourceId"]]["datePublished"]
        basis = "not_established" if published_on is None else "source_publication_date"
        if row["knownFrom"] != published_on or row["knownFromBasis"] != basis:
            fail("%s: knownFrom does not match the publication date of %s" % (what, row["sourceId"]))
        if row["status"] == "scheduled" and row["effectiveThrough"] is not None:
            fail("%s: a scheduled entry states takesEffectOn, not effectiveThrough" % what)
        if row["status"] != "scheduled" and row["takesEffectOn"] is not None:
            fail("%s: takesEffectOn belongs to a scheduled entry only" % what)
        start, end = row["effectiveFrom"], row["effectiveThrough"]
        if start is not None and end is not None and end < start:
            fail("%s: effectiveThrough precedes effectiveFrom" % what)
        if start is not None:
            if (row["measureId"], start) in dated:
                fail("%s: clause %s already has an entry starting %s" % (what, row["measureId"], start))
            dated.add((row["measureId"], start))

    for measure_id in measures:
        if measure_id not in with_status:
            fail("measure %s has no status entry" % measure_id)
        if measure_id not in cited:
            fail("measure %s has no evidence" % measure_id)


# --------------------------------------------------------------------------
# 6. Reading and verifying a release directory
# --------------------------------------------------------------------------

def release_digest(manifest):
    """Hash the complete manifest with releaseId omitted to avoid a circular digest."""
    identity = {key: value for key, value in manifest.items() if key != "releaseId"}
    return sha256_hex(stable_json(identity).encode("utf-8"))


def pending_keys(manifest, rows):
    """Keys of the rows a person has not yet published, per dataset."""
    result = {}
    for dataset in DATASET_FILES:
        key = manifest["datasets"][dataset]["key"]
        keys = [row[key] for row in rows[dataset] if row["reviewState"] != PUBLISHED]
        if keys:
            result[dataset] = keys
    return result


def check_manifest_shape(manifest):
    if not isinstance(manifest, dict):
        fail("manifest.json is not an object")
    if manifest.get("feed") != FEED_NAME:
        fail("manifest.json does not describe a %s release" % FEED_NAME)
    version = manifest.get("profileVersion")
    if not isinstance(version, str) or version.split(".")[0] != SUPPORTED_PROFILE_MAJOR:
        fail("profile version %s is not supported; this loader reads major version %s only" % (version, SUPPORTED_PROFILE_MAJOR))
    for name in ("releaseId", "reviewState", "curatedOn", "legalStatusCutoff"):
        if not isinstance(manifest.get(name), str):
            fail("manifest.json states no %s" % name)
    if not is_calendar_date(manifest["legalStatusCutoff"]) or not is_calendar_date(manifest["curatedOn"]):
        fail("manifest.json: curatedOn and legalStatusCutoff must be calendar dates")
    table = manifest.get("datasets")
    if not isinstance(table, dict) or sorted(table) != sorted(DATASET_FILES):
        fail("manifest.json does not list exactly the six datasets of profile version 1")
    for dataset in DATASET_FILES:
        stated = table[dataset]
        if (
            not isinstance(stated, dict)
            or not is_count(stated.get("rows"))
            or not isinstance(stated.get("sha256"), str)
            or not isinstance(stated.get("key"), str)
        ):
            fail("manifest.json: the entry for %s needs rows, sha256 and key" % dataset)
    profile = manifest.get("profile")
    if not isinstance(profile, dict) or not isinstance(profile.get("sha256"), str):
        fail("manifest.json states no profile hash")
    changes_from = manifest.get("changesFrom")
    if changes_from is not None and not (
        isinstance(changes_from, dict)
        and isinstance(changes_from.get("releaseId"), str)
        and isinstance(changes_from.get("sha256"), str)
    ):
        fail("manifest.json: changesFrom needs releaseId and sha256")


def read_release_dir(directory):
    """Verify and validate a release directory. Returns the release ready to store, or refuses."""
    if not directory.is_dir():
        fail("feed directory is missing: %s" % directory)

    manifest_raw, manifest_text = read_file(directory / "manifest.json", "manifest.json")
    manifest = parse_json(manifest_text, "manifest.json")
    check_manifest_shape(manifest)

    # 1. Every dataset file matches the hash and row count the manifest states.
    rows = {}
    for dataset in DATASET_FILES:
        stated = manifest["datasets"][dataset]
        raw, text = read_file(directory / dataset, dataset)
        actual = sha256_hex(raw)
        if actual != stated["sha256"]:
            fail("%s does not match its manifest: expected sha256 %s, found %s" % (dataset, stated["sha256"], actual))
        parsed = parse_json(text, dataset)
        if not isinstance(parsed, list) or len(parsed) != stated["rows"]:
            fail("%s does not match its manifest: expected %d rows" % (dataset, stated["rows"]))
        rows[dataset] = parsed

    # 2. Bind every manifest field, including curation, review and the named predecessor.
    release_id = manifest["releaseId"]
    digest = release_digest(manifest)
    review = manifest.get("pendingReview")
    overlay = ""
    if review is not None:
        if not isinstance(review, dict) or not is_id(review.get("overlayId")):
            fail("manifest.json: invalid pending overlay identifier")
        overlay = "-" + review["overlayId"]
    expected = RELEASE_ID_PREFIX + manifest["legalStatusCutoff"] + overlay + "-" + digest
    if release_id != expected:
        fail("releaseId does not match the manifest: expected %s" % expected)

    # 3. profile.json and, when shipped, changes.json match the manifest.
    profile_raw, profile_text = read_file(directory / "profile.json", "profile.json")
    if sha256_hex(profile_raw) != manifest["profile"]["sha256"]:
        fail("profile.json does not match its manifest")
    if manifest["profile"]["sha256"] != REVIEWED_PROFILES.get(manifest["profileVersion"]):
        fail("this loader has no reviewed allowlist for the supplied profile and hash")
    profile = parse_json(profile_text, "profile.json")
    if not isinstance(profile, dict) or profile.get("feed") != FEED_NAME or profile.get("profileVersion") != manifest["profileVersion"]:
        fail("profile.json does not describe profile version %s of this feed" % manifest["profileVersion"])

    documents = {"profile.json": (profile_text, sha256_hex(profile_raw))}
    changes_path = directory / "changes.json"
    changes_from = manifest["changesFrom"] if "changesFrom" in manifest else None
    if changes_from is not None and not changes_path.is_file():
        fail("the manifest lists changes.json but it is missing")
    if changes_path.exists():
        if changes_from is None:
            fail("changes.json is present but the manifest does not list it")
        changes_raw, changes_text = read_file(changes_path, "changes.json")
        if sha256_hex(changes_raw) != changes_from["sha256"]:
            fail("changes.json does not match its manifest")
        changes = parse_json(changes_text, "changes.json")
        check_shipped_changes(changes, changes_from)
        documents["changes.json"] = (changes_text, sha256_hex(changes_raw))

    # 4. Every row against the profile, then every join.
    validate_rows(profile, manifest, rows)
    check_references(rows)

    # 5. The manifest's own account of pending rows agrees with the rows.
    pending = pending_keys(manifest, rows)
    review = manifest.get("pendingReview")
    if manifest["reviewState"] == PUBLISHED_RECORD:
        if pending or review is not None:
            fail("the manifest calls this the published record, but it carries rows that are not published")
    else:
        listed = review.get("rows") if isinstance(review, dict) else None
        if not isinstance(listed, dict) or {name: sorted(keys) for name, keys in listed.items()} != {
            name: sorted(keys) for name, keys in pending.items()
        }:
            fail("manifest.pendingReview.rows does not list exactly the rows marked as not published")

    known = set(DATASET_FILES) | {"manifest.json", "profile.json", "changes.json"}
    ignored = sorted(entry.name for entry in directory.iterdir() if entry.name not in known)
    if ignored:
        fail("release directory contains unexpected files: %s" % ", ".join(ignored))
    return {
        "releaseId": release_id,
        "manifest": manifest,
        "manifestText": manifest_text,
        "manifestSha256": sha256_hex(manifest_raw),
        "documents": documents,
        "rows": rows,
        "ignoredFiles": ignored,
    }


def check_shipped_changes(changes, changes_from):
    """changes.json must name this release and the stated predecessor, and match the manifest's counts."""
    table = changes.get("datasets") if isinstance(changes, dict) else None
    if not isinstance(table, dict) or sorted(table) != sorted(DATASET_FILES):
        fail("changes.json does not cover exactly the six datasets")
    if changes.get("to") != "this_release" or changes.get("from") != changes_from["releaseId"]:
        fail("changes.json names different releases than the manifest")
    summary = changes_from.get("summary")
    for dataset in DATASET_FILES:
        entry = table[dataset]
        if not isinstance(entry, dict) or not all(isinstance(entry.get(name), list) for name in ("added", "removed", "changed")):
            fail("changes.json: the entry for %s needs added, removed and changed" % dataset)
        counts = {name: len(entry[name]) for name in ("added", "removed", "changed")}
        if isinstance(summary, dict) and summary.get(dataset) != counts:
            fail("changes.json does not match the change summary in the manifest for %s" % dataset)


# --------------------------------------------------------------------------
# 7. Storage
# --------------------------------------------------------------------------

def connect(db_path, create):
    """Open the database. Read commands open it read-only and never create it."""
    path = Path(db_path)
    if create:
        return sqlite3.connect(str(path), isolation_level=None)
    if not path.is_file():
        fail("database not found: %s" % db_path)
    return sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True, isolation_level=None)


def ensure_schema(db):
    version = db.execute("PRAGMA user_version").fetchone()[0]
    if version == SCHEMA_VERSION:
        return
    if version != 0 or db.execute("SELECT count(*) FROM sqlite_master").fetchone()[0] != 0:
        fail("the database was not created by this consumer (schema version %s)" % version)
    for statement in SCHEMA:
        db.execute(statement)
    for table in IMMUTABLE_TABLES:
        for action in ("UPDATE", "DELETE"):
            db.execute(
                "CREATE TRIGGER %s_no_%s BEFORE %s ON %s BEGIN SELECT RAISE(ABORT, 'stored releases are immutable'); END"
                % (table, action.lower(), action, table)
            )
    db.execute("PRAGMA user_version = %d" % SCHEMA_VERSION)


def store_release(db, release):
    """Store a verified release in one transaction. Returns ("loaded" | "already_loaded", load_seq, rows written)."""
    db.execute("BEGIN IMMEDIATE")
    try:
        ensure_schema(db)
        release_id = release["releaseId"]
        stored = db.execute("SELECT load_seq, manifest_sha256 FROM releases WHERE release_id = ?", (release_id,)).fetchone()
        incoming = {name: digest for name, (_, digest) in release["documents"].items()}
        if stored is not None:
            held = dict(db.execute("SELECT name, sha256 FROM release_documents WHERE release_id = ?", (release_id,)).fetchall())
            if stored[1] != release["manifestSha256"] or held != incoming:
                fail(
                    "release %s is already stored with different content; a release identity names one payload, so this directory is refused"
                    % release_id
                )
            db.execute("ROLLBACK")
            return "already_loaded", stored[0], 0

        load_seq = db.execute("SELECT coalesce(max(load_seq), 0) + 1 FROM releases").fetchone()[0]
        db.execute(
            "INSERT INTO releases (release_id, load_seq, manifest_json, manifest_sha256) VALUES (?, ?, ?, ?)",
            (release_id, load_seq, release["manifestText"], release["manifestSha256"]),
        )
        for name, (content, digest) in sorted(release["documents"].items()):
            db.execute(
                "INSERT INTO release_documents (release_id, name, content, sha256) VALUES (?, ?, ?, ?)",
                (release_id, name, content, digest),
            )
        written = 0
        for dataset in DATASET_FILES:
            key = release["manifest"]["datasets"][dataset]["key"]
            for index, row in enumerate(release["rows"][dataset]):
                db.execute(
                    "INSERT INTO release_rows (release_id, dataset, row_index, row_key, row_json, row_sha256) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        release_id,
                        dataset,
                        index,
                        row[key],
                        json.dumps(row, ensure_ascii=False, separators=(",", ":")),
                        sha256_hex(canonical_json(row).encode("utf-8")),
                    ),
                )
                written += 1
        previous = release["manifest"].get("changesFrom")
        if previous and db.execute("SELECT 1 FROM releases WHERE release_id = ?", (previous["releaseId"],)).fetchone():
            before = StoredRelease(db, previous["releaseId"])
            after = StoredRelease(db, release_id)
            compare_with_publisher(before, after, compare_releases(before, after))
        db.execute("COMMIT")
        return "loaded", load_seq, written
    except BaseException:
        db.execute("ROLLBACK")
        raise


class StoredRelease:
    """One release read back from the database, with the indexes the replay rules use."""

    def __init__(self, db, release_id):
        found = db.execute("SELECT load_seq, manifest_json FROM releases WHERE release_id = ?", (release_id,)).fetchone()
        if found is None:
            fail("release %s is not stored in this database" % release_id)
        self.load_seq = found[0]
        self.manifest = parse_json(found[1], "stored manifest")
        self.release_id = release_id
        self.review_state = self.manifest["reviewState"]
        self.cutoff = self.manifest["legalStatusCutoff"]
        self.documents = dict(db.execute("SELECT name, content FROM release_documents WHERE release_id = ?", (release_id,)).fetchall())

        self.rows = {dataset: [] for dataset in DATASET_FILES}
        self.hashes = {dataset: {} for dataset in DATASET_FILES}
        cursor = db.execute(
            "SELECT dataset, row_key, row_json, row_sha256 FROM release_rows WHERE release_id = ? ORDER BY dataset, row_index",
            (release_id,),
        )
        for dataset, row_key, row_json, row_sha256 in cursor:
            row = parse_json(row_json, "stored row")
            if sha256_hex(canonical_json(row).encode("utf-8")) != row_sha256:
                fail("stored row %s of %s no longer matches its hash" % (row_key, dataset))
            self.rows[dataset].append(row)
            self.hashes[dataset][row_key] = row_sha256
        for dataset in DATASET_FILES:
            if len(self.rows[dataset]) != self.manifest["datasets"][dataset]["rows"]:
                fail("stored release %s no longer holds every row of %s" % (release_id, dataset))

        self.instruments = {row["instrumentId"]: row for row in self.rows["instruments.json"]}
        self.sources = {row["sourceId"]: row for row in self.rows["sources.json"]}
        self.measures = {row["measureId"]: row for row in self.rows["measures.json"]}
        self.entries = {}
        for row in self.rows["status-entries.json"]:
            self.entries.setdefault(row["measureId"], []).append(row)
        self.evidence = {}
        for row in self.rows["evidence.json"]:
            self.evidence.setdefault(row["measureId"], []).append(row)

    def keyed(self, dataset):
        key = self.manifest["datasets"][dataset]["key"]
        return {row[key]: row for row in self.rows[dataset]}


def resolve_release_id(db, wanted):
    if wanted != "latest":
        return wanted
    found = db.execute("SELECT release_id FROM releases ORDER BY load_seq DESC LIMIT 1").fetchone()
    if found is None:
        fail("the database holds no release")
    return found[0]


class Store:
    """Read access to the database with each release parsed once per process."""

    def __init__(self, db):
        self.db = db
        self.cache = {}

    def release(self, wanted):
        if not isinstance(wanted, str) or wanted == "":
            fail("a release is required: a releaseId or \"latest\"")
        release_id = resolve_release_id(self.db, wanted)
        if release_id not in self.cache:
            self.cache[release_id] = StoredRelease(self.db, release_id)
        return self.cache[release_id]


# --------------------------------------------------------------------------
# 8. Replay rules
# --------------------------------------------------------------------------

def check_replay_dates(vintage, *days):
    for day in days:
        if not is_calendar_date(day):
            fail('"%s" is not a calendar date' % day)
    if vintage != "release" and not is_calendar_date(vintage):
        fail('vintage must be a calendar date or "release"')


def usable_entries(release, measure_id, vintage, include_pending):
    """Split a clause's status entries by what the question is allowed to use.

    An entry is left out when it is pending and pending rows were not asked
    for, or when the vintage is a date and the entry's source was published
    after it, or carries no publication date.
    """
    view = {"dated": [], "undated": [], "pendingIgnored": 0, "knowledgeDateMissing": 0, "notYetKnowable": 0}
    for entry in release.entries.get(measure_id, []):
        if entry["reviewState"] != PUBLISHED and not include_pending:
            view["pendingIgnored"] += 1
        elif vintage != "release" and entry["knownFrom"] is None:
            view["knowledgeDateMissing"] += 1
        elif vintage != "release" and entry["knownFrom"] > vintage:
            view["notYetKnowable"] += 1
        elif entry["effectiveFrom"] is None:
            view["undated"].append(entry)
        else:
            view["dated"].append(entry)
    view["dated"].sort(key=lambda entry: entry["effectiveFrom"])
    return view


def standing_of(release, measure_id, on_date, vintage, include_pending):
    """The standing of one clause on one day, as far as the vintage can know it.

    The governing entry is the last usable dated entry that starts on or
    before the day. effectiveThrough is the last day an entry applies. The day
    after a stated window, and any day from a scheduled entry's takesEffectOn,
    is "unresolved" unless another entry starts: the record does not say the
    clause returned to force or ended.
    """
    check_replay_dates(vintage, on_date)
    if measure_id not in release.measures or (not include_pending and release.measures[measure_id]["reviewState"] != PUBLISHED):
        fail('the release has no measure "%s"' % measure_id)
    view = usable_entries(release, measure_id, vintage, include_pending)

    governing = None
    for entry in view["dated"]:
        if entry["effectiveFrom"] <= on_date:
            governing = entry

    projected = on_date > release.cutoff or (vintage != "release" and on_date > vintage)
    window_ended_on = None
    if governing is not None:
        rests_on = governing
        if governing["status"] == "scheduled" and governing["takesEffectOn"] is not None and on_date >= governing["takesEffectOn"]:
            state, basis = "unresolved", "scheduled_date_passed_no_successor"
        elif governing["effectiveThrough"] is not None and on_date > governing["effectiveThrough"]:
            state, basis = "unresolved", "window_passed_no_successor"
            window_ended_on = governing["effectiveThrough"]
        elif projected:
            state, basis = "projected", "projected_from_record"
        else:
            state, basis = governing["status"], "in_effect"
    elif view["undated"]:
        # An undated entry shows a status was stated, never that it held on a given day.
        rests_on = view["undated"][0]
        state, basis = "unresolved", "undated_only"
    else:
        rests_on = None
        state = "not_recorded"
        basis = "before_first_entry" if view["dated"] else "no_knowable_entry"

    return {
        "measureId": measure_id,
        "onDate": on_date,
        "vintage": vintage,
        "state": state,
        "basis": basis,
        "entryId": rests_on["entryId"] if rests_on else None,
        "sourceId": rests_on["sourceId"] if rests_on else None,
        "lastStatedStatus": rests_on["status"] if rests_on else None,
        "windowEndedOn": window_ended_on,
        "pendingReview": bool(rests_on) and rests_on["reviewState"] != PUBLISHED,
        "reviewState": rests_on["reviewState"] if rests_on else None,
        "projected": projected,
        "beyondCutoff": on_date > release.cutoff,
        "knowledgeDateMissing": view["knowledgeDateMissing"],
        "pendingEntriesIgnored": view["pendingIgnored"],
    }


def restriction_exclusion(release, measure, include_pending):
    """Why a clause is not counted as an outbound restriction under a verified instrument, or None."""
    if measure["direction"] not in OUTBOUND_DIRECTIONS:
        return "direction_not_outbound"
    if measure["measureType"] not in RESTRICTION_TYPES:
        return "not_a_restriction_type"
    # The join is on instrumentId. Document numbers restart each year and can repeat.
    instrument = release.instruments.get(measure["instrumentId"])
    if instrument is None:
        return "instrument_not_verified"
    candidate = include_pending and instrument["reviewState"] != PUBLISHED and instrument["verificationStatus"] == "provisional"
    if instrument["verificationStatus"] != "verified" and not candidate:
        return "instrument_not_verified"
    return None


def classify(measure, material, destination):
    """Return ("excluded", reason) or ("match", match class) for one restriction clause."""
    scopes = measure["targetScopes"]
    worldwide = "all_jurisdictions" in scopes
    named = "named_jurisdictions" in scopes
    if named and not worldwide and destination not in measure["targetJurisdictions"]:
        return "excluded", "destination_not_named"
    if material not in measure["materialIds"]:
        if measure["materialIds"] and measure["materialAttribution"] == "tracked_only":
            return "excluded", "material_not_tagged"
        return "match", "material_scope_requires_review"
    only_place_scopes = all(scope in ("all_jurisdictions", "named_jurisdictions") for scope in scopes)
    if (worldwide or named) and only_place_scopes:
        return "match", "material_and_destination_coded"
    return "match", "destination_or_transaction_scope_requires_review"


def pending_summary(include_pending):
    return {"included": include_pending, "usedStatusEntryIds": [], "usedEvidenceIds": [], "ignoredStatusEntries": 0}


def note_standing(summary, standing):
    if standing["pendingReview"] and standing["entryId"] not in summary["usedStatusEntryIds"]:
        summary["usedStatusEntryIds"].append(standing["entryId"])
    summary["ignoredStatusEntries"] += standing["pendingEntriesIgnored"]


def answer_header(release, include_pending):
    return {"releaseId": release.release_id, "releaseReviewState": release.review_state, "includePending": include_pending}


def answer_standing(release, measure_id, on_date, vintage, include_pending):
    answer = answer_header(release, include_pending)
    answer.update(standing_of(release, measure_id, on_date, vintage, include_pending))
    answer["notice"] = NOTICE
    return answer


def answer_query(release, material, destination, on_date, issuer, vintage, include_pending):
    """Clauses the record codes for a material and destination on a day. One row per clause."""
    check_replay_dates(vintage, on_date)
    if not is_country(destination):
        fail("destination must be a two-letter country code")
    if not isinstance(material, str) or material == "":
        fail("material is required")
    matches, excluded = [], []
    pending = pending_summary(include_pending)
    all_measures = [row for row in release.rows["measures.json"] if include_pending or row["reviewState"] == PUBLISHED]
    for measure in all_measures:
        measure_id = measure["measureId"]
        if issuer is not None and measure["issuer"] != issuer:
            excluded.append({"measureId": measure_id, "reason": "other_issuer"})
            continue
        reason = restriction_exclusion(release, measure, include_pending)
        if reason is None:
            outcome, detail = classify(measure, material, destination)
            if outcome == "excluded":
                reason = detail
        if reason is not None:
            excluded.append({"measureId": measure_id, "reason": reason})
            continue

        standing = standing_of(release, measure_id, on_date, vintage, include_pending)
        note_standing(pending, standing)
        citations = []
        for row in release.evidence.get(measure_id, []):
            published = release.sources[row["sourceId"]]["datePublished"]
            if vintage != "release" and (published is None or published > vintage):
                continue
            if row["reviewState"] != PUBLISHED and not include_pending:
                continue
            if row["reviewState"] != PUBLISHED:
                pending["usedEvidenceIds"].append(row["evidenceId"])
            citations.append({
                "evidenceId": row["evidenceId"],
                "sourceId": row["sourceId"],
                "url": release.sources[row["sourceId"]]["url"],
                "locator": row["locator"],
                "locatorWithheld": row["locatorWithheld"],
                "supports": row["supports"],
                "reviewState": row["reviewState"],
            })
        wording = [item for item in measure["limitations"] if item["field"] == "product_scope_text"]
        scopes = measure["targetScopes"]
        instrument = release.instruments[measure["instrumentId"]]
        matches.append({
            "measureId": measure_id,
            "instrumentId": measure["instrumentId"],
            "documentNumber": instrument["documentNumber"],
            "issuer": measure["issuer"],
            "measureType": measure["measureType"],
            "clauseLabel": measure["clauseLabel"],
            "reviewState": measure["reviewState"],
            "match": detail,
            "target": "worldwide" if "all_jurisdictions" in scopes else "named" if "named_jurisdictions" in scopes else "other",
            "materialIds": measure["materialIds"],
            "standing": standing,
            "productScope": {
                "legalScopeCodes": ["%s:%s" % (code["system"], code["code"]) for code in measure["productCodes"] if code["role"] == "legal_scope"],
                "referenceCodes": ["%s:%s" % (code["system"], code["code"]) for code in measure["productCodes"] if code["role"] == "reference"],
                "wordingWithheld": bool(wording),
                "wordingSourceIds": wording[0]["sourceIds"] if wording else [],
            },
            "limitations": measure["limitations"],
            "citations": citations,
            "coverage": measure["coverage"],
        })

    answer = answer_header(release, include_pending)
    answer.update({
        "query": {
            "material": material,
            "destination": destination,
            "onDate": on_date,
            "issuer": issuer,
            "vintage": vintage,
            "includePending": include_pending,
        },
        # False means the release holds no clause from that issuer, or none tagged with that
        # material. Either is a coverage gap, not a finding that nothing applies.
        "issuerCovered": True if issuer is None else any(row["issuer"] == issuer for row in all_measures),
        "materialTracked": any(material in row["materialIds"] for row in all_measures),
        "matches": matches,
        "inForceCoded": [
            row["measureId"]
            for row in matches
            if row["match"] == "material_and_destination_coded" and row["standing"]["state"] == "in_force"
        ],
        "projectedInForceCoded": [
            row["measureId"] for row in matches
            if row["match"] == "material_and_destination_coded" and row["standing"]["state"] == "projected"
            and row["standing"]["lastStatedStatus"] == "in_force"
        ],
        "excluded": excluded,
        "pendingRows": pending,
        "notice": NOTICE,
    })
    return answer


def answer_counts(release, start, end, vintage, include_pending):
    """First-introduced and in-force counts for an inclusive window, by clause and by instrument.

    A clause is introduced on the start of its first dated in_force entry. A
    suspension, a continued suspension or any other status change introduces
    nothing.
    """
    check_replay_dates(vintage, start, end)
    if start > end:
        fail("start must not follow end")
    introduced, in_force, projected_in_force = [], [], []
    pending = pending_summary(include_pending)
    for measure in release.rows["measures.json"]:
        if not include_pending and measure["reviewState"] != PUBLISHED:
            continue
        if restriction_exclusion(release, measure, include_pending) is not None:
            continue
        measure_id = measure["measureId"]
        view = usable_entries(release, measure_id, vintage, include_pending)
        first = next((entry for entry in view["dated"] if entry["status"] == "in_force"), None)
        if first is not None and start <= first["effectiveFrom"] <= end:
            introduced.append(measure)
            if first["reviewState"] != PUBLISHED and first["entryId"] not in pending["usedStatusEntryIds"]:
                pending["usedStatusEntryIds"].append(first["entryId"])
        standing = standing_of(release, measure_id, end, vintage, include_pending)
        note_standing(pending, standing)
        if standing["state"] == "in_force":
            in_force.append(measure)
        elif standing["state"] == "projected" and standing["lastStatedStatus"] == "in_force":
            projected_in_force.append(measure)

    def clause_ids(rows):
        return sorted(row["measureId"] for row in rows)

    def instrument_ids(rows):
        return sorted({row["instrumentId"] for row in rows})

    answer = answer_header(release, include_pending)
    answer.update({
        "start": start,
        "end": end,
        "vintage": vintage,
        "introducedClauses": clause_ids(introduced),
        "introducedInstruments": instrument_ids(introduced),
        "inForceClausesAtEnd": clause_ids(in_force),
        "inForceInstrumentsAtEnd": instrument_ids(in_force),
        "projectedInForceClausesAtEnd": clause_ids(projected_in_force),
        "projectedInForceInstrumentsAtEnd": instrument_ids(projected_in_force),
        "pendingRows": pending,
        "notice": NOTICE,
    })
    return answer


# --------------------------------------------------------------------------
# 9. Comparing two stored releases
# --------------------------------------------------------------------------

def compare_releases(before, after):
    """Compare by key and row hash. Returns {dataset: {added, removed, changed}}."""
    result = {}
    for dataset in DATASET_FILES:
        old_hashes, new_hashes = before.hashes[dataset], after.hashes[dataset]
        old_rows, new_rows = before.keyed(dataset), after.keyed(dataset)
        changed = []
        for key in sorted(key for key in new_hashes if key in old_hashes and old_hashes[key] != new_hashes[key]):
            old, new = old_rows[key], new_rows[key]
            fields = [
                {"path": name, "before": old.get(name), "after": new.get(name)}
                for name in sorted(set(old) | set(new))
                if canonical_json(old.get(name)) != canonical_json(new.get(name))
            ]
            changed.append({"key": key, "fields": fields})
        result[dataset] = {
            "added": sorted(key for key in new_hashes if key not in old_hashes),
            "removed": sorted(key for key in old_hashes if key not in new_hashes),
            "changed": changed,
        }
    return result


def compare_with_publisher(before, after, computed):
    """Hold the comparison against the changes.json the newer release shipped, when it names the same pair."""
    text = after.documents.get("changes.json")
    if text is None:
        return {"shipped": False, "from": None, "agrees": None}
    shipped = parse_json(text, "stored changes.json")
    if shipped.get("from") != before.release_id:
        # The publisher compared against another release. There is nothing to hold this against.
        return {"shipped": True, "from": shipped.get("from"), "agrees": None}

    def normal(entry):
        return {
            "added": sorted(entry["added"]),
            "removed": sorted(entry["removed"]),
            "changed": {
                item["key"]: {field["path"]: [field["before"], field["after"]] for field in item["fields"]}
                for item in entry["changed"]
            },
        }

    for dataset in DATASET_FILES:
        if canonical_json(normal(shipped["datasets"][dataset])) != canonical_json(normal(computed[dataset])):
            fail(
                "the stored rows of %s differ from %s in a way the publisher's changes.json does not describe (%s); do not rely on either list until this is resolved"
                % (after.release_id, before.release_id, dataset)
            )
    return {"shipped": True, "from": before.release_id, "agrees": True}


def status_citations(release, computed):
    """One citation per added or changed status entry: the entry, its source and the supporting locators."""
    entries = release.keyed("status-entries.json")
    table = computed["status-entries.json"]
    wanted = [(key, "added") for key in table["added"]] + [(item["key"], "changed") for item in table["changed"]]
    citations = []
    for entry_id, change in sorted(wanted):
        entry = entries[entry_id]
        source = release.sources[entry["sourceId"]]
        measure = release.measures[entry["measureId"]]
        citations.append({
            "change": change,
            "entryId": entry_id,
            "measureId": entry["measureId"],
            "instrumentId": measure["instrumentId"],
            "status": entry["status"],
            "effectiveFrom": entry["effectiveFrom"],
            "effectiveThrough": entry["effectiveThrough"],
            "takesEffectOn": entry["takesEffectOn"],
            "knownFrom": entry["knownFrom"],
            "reviewState": entry["reviewState"],
            "source": {
                "sourceId": source["sourceId"],
                "url": source["url"],
                "publisher": source["publisher"],
                "datePublished": source["datePublished"],
                "reviewState": source["reviewState"],
            },
            "evidence": [
                {
                    "evidenceId": row["evidenceId"],
                    "locator": row["locator"],
                    "locatorWithheld": row["locatorWithheld"],
                    "evidenceLevel": row["evidenceLevel"],
                    "supports": row["supports"],
                    "reviewState": row["reviewState"],
                }
                for row in release.evidence.get(entry["measureId"], [])
                if row["sourceId"] == entry["sourceId"] and "status" in row["supports"]
            ],
        })
    return citations


def answer_diff(store, from_id, to_id):
    before, after = store.release(from_id), store.release(to_id)
    computed = compare_releases(before, after)
    return {
        "from": before.release_id,
        "to": after.release_id,
        "fromReviewState": before.review_state,
        "toReviewState": after.review_state,
        "datasets": computed,
        "summary": {
            dataset: {name: len(computed[dataset][name]) for name in ("added", "removed", "changed")}
            for dataset in DATASET_FILES
        },
        "publisherChanges": compare_with_publisher(before, after, computed),
        "citations": status_citations(after, computed),
        "notice": NOTICE,
    }


# --------------------------------------------------------------------------
# 10. Commands
# --------------------------------------------------------------------------

def release_summary(manifest, rows_pending):
    review = manifest.get("pendingReview")
    changes_from = manifest.get("changesFrom")
    return {
        "releaseId": manifest["releaseId"],
        "profileVersion": manifest["profileVersion"],
        "reviewState": manifest["reviewState"],
        "curatedOn": manifest["curatedOn"],
        "legalStatusCutoff": manifest["legalStatusCutoff"],
        "rows": {dataset: manifest["datasets"][dataset]["rows"] for dataset in DATASET_FILES},
        "pendingRows": {dataset: len(rows_pending.get(dataset, [])) for dataset in DATASET_FILES},
        "pendingReview": None if review is None else {
            name: review.get(name) for name in ("overlayId", "preparedOn", "sourceCheckedOn", "reviewedAt")
        },
        "changesFrom": None if changes_from is None else changes_from["releaseId"],
    }


def command_load(args):
    release = read_release_dir(Path(args.feed_dir))
    db = connect(args.db, create=True)
    try:
        outcome, load_seq, written = store_release(db, release)
    finally:
        db.close()
    answer = {"outcome": outcome, "loadSeq": load_seq, "rowsWritten": written}
    answer.update(release_summary(release["manifest"], pending_keys(release["manifest"], release["rows"])))
    answer["changesFileStored"] = "changes.json" in release["documents"]
    answer["ignoredFiles"] = release["ignoredFiles"]
    return answer


def command_releases(args):
    db = connect(args.db, create=False)
    try:
        listing = []
        ids = [row[0] for row in db.execute("SELECT release_id FROM releases ORDER BY load_seq")]
        for release_id in ids:
            release = StoredRelease(db, release_id)
            entry = {"loadSeq": release.load_seq}
            entry.update(release_summary(release.manifest, pending_keys(release.manifest, release.rows)))
            entry["changesFileStored"] = "changes.json" in release.documents
            listing.append(entry)
    finally:
        db.close()
    return {"releases": listing, "latest": listing[-1]["releaseId"] if listing else None}


REQUEST_FIELDS = {
    "standing": ("release", "measure", "on"),
    "query": ("release", "material", "destination", "on"),
    "counts": ("release", "start", "end"),
    "diff": ("from", "to"),
}
OPTIONAL_FIELDS = {
    "standing": ("vintage", "includePending"),
    "query": ("issuer", "vintage", "includePending"),
    "counts": ("vintage", "includePending"),
    "diff": (),
}


def run_request(store, request):
    """Run one replay or diff request given as a dict. The command-line flags map onto the same names."""
    if not isinstance(request, dict) or request.get("command") not in REQUEST_FIELDS:
        fail("a request needs a command: standing, query, counts or diff")
    command = request["command"]
    allowed = ("command",) + REQUEST_FIELDS[command] + OPTIONAL_FIELDS[command]
    for name in request:
        if name not in allowed:
            fail('%s does not take "%s"' % (command, name))
    for name in REQUEST_FIELDS[command]:
        if not isinstance(request.get(name), str) or request[name] == "":
            fail('%s needs "%s"' % (command, name))
    if command == "diff":
        return answer_diff(store, request["from"], request["to"])

    vintage = request.get("vintage")
    vintage = "release" if vintage is None else vintage
    include_pending = request.get("includePending", False)
    if not isinstance(vintage, str) or not isinstance(include_pending, bool):
        fail("vintage must be text and includePending must be true or false")
    release = store.release(request["release"])
    review = release.manifest.get("pendingReview") or {}
    if review.get("publishedReplayRequiresBaseline") and not include_pending:
        fail("This candidate replaces published entries. Load the published baseline for published-only replay.")
    if command == "standing":
        return answer_standing(release, request["measure"], request["on"], vintage, include_pending)
    if command == "counts":
        return answer_counts(release, request["start"], request["end"], vintage, include_pending)
    issuer = request.get("issuer")
    if issuer is not None and not isinstance(issuer, str):
        fail("issuer must be text")
    return answer_query(release, request["material"], request["destination"], request["on"], issuer, vintage, include_pending)


def command_single(args):
    request = {"command": args.command}
    for flag, name in (
        ("release", "release"), ("measure", "measure"), ("on", "on"), ("material", "material"),
        ("destination", "destination"), ("issuer", "issuer"), ("start", "start"), ("end", "end"),
        ("vintage", "vintage"), ("from_release", "from"), ("to_release", "to"),
    ):
        value = getattr(args, flag, None)
        if value is not None:
            request[name] = value
    if getattr(args, "include_pending", False):
        request["includePending"] = True
    db = connect(args.db, create=False)
    try:
        return run_request(Store(db), request)
    finally:
        db.close()


def command_batch(args):
    """Run many requests against one open database. A failed request is reported in place."""
    if args.requests:
        _, text = read_file(Path(args.requests), "the request file")
    else:
        text = sys.stdin.buffer.read().decode("utf-8")
    requests = parse_json(text, "the request list")
    if not isinstance(requests, list):
        fail("the request list must be a JSON array")
    db = connect(args.db, create=False)
    try:
        store = Store(db)
        results = []
        for request in requests:
            try:
                results.append({"ok": True, "result": run_request(store, request)})
            except ConsumerError as error:
                results.append({"ok": False, "error": one_line(error)})
    finally:
        db.close()
    return {"results": results, "failed": sum(1 for item in results if not item["ok"])}


class Parser(argparse.ArgumentParser):
    """Report a usage problem as one line instead of a usage block."""

    def error(self, message):
        fail(message)


def build_parser():
    parser = Parser(prog="consumer.py", description="Reference consumer for the Stratellar Controls integration feed.")
    commands = parser.add_subparsers(dest="command")

    def add(name, handler, summary):
        sub = commands.add_parser(name, help=summary)
        sub.add_argument("--db", required=True, help="sqlite database file")
        sub.set_defaults(handler=handler)
        return sub

    def add_replay_options(sub):
        sub.add_argument("--release", required=True, help='a releaseId, or "latest" for the release loaded last')
        sub.add_argument("--vintage", help='a date: use only entries whose source was published by then. Default "release".')
        sub.add_argument("--include-pending", action="store_true", help="also use rows a person has not yet adjudicated")

    load = add("load", command_load, "verify, validate and store one release directory")
    load.add_argument("feed_dir")

    add("releases", command_releases, "list stored releases in load order")

    diff = add("diff", command_single, "compare two stored releases")
    diff.add_argument("--from", dest="from_release", required=True)
    diff.add_argument("--to", dest="to_release", required=True)

    query = add("query", command_single, "clauses coded for a material and destination on a day")
    add_replay_options(query)
    query.add_argument("--material", required=True)
    query.add_argument("--destination", required=True, help="ISO 3166-1 alpha-2 code")
    query.add_argument("--on", required=True)
    query.add_argument("--issuer")

    standing = add("standing", command_single, "standing of one clause on a day")
    add_replay_options(standing)
    standing.add_argument("--measure", required=True)
    standing.add_argument("--on", required=True)

    counts = add("counts", command_single, "introduced and in-force counts for an inclusive window")
    add_replay_options(counts)
    counts.add_argument("--start", required=True)
    counts.add_argument("--end", required=True)

    batch = add("batch", command_batch, "run a JSON list of requests in one process")
    batch.add_argument("--requests", help="file holding the request list; stdin when omitted")
    return parser


def one_line(error):
    return " ".join(str(error).split())


def main(argv):
    try:
        args = build_parser().parse_args(argv)
        if not getattr(args, "handler", None):
            fail("a command is required: load, releases, diff, query, standing, counts or batch")
        answer = args.handler(args)
    except ConsumerError as error:
        sys.stderr.write("consumer: %s\n" % one_line(error))
        return 1
    except (sqlite3.Error, OSError) as error:
        sys.stderr.write("consumer: %s\n" % one_line(error))
        return 1
    sys.stdout.buffer.write((json.dumps(answer, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    if args.command == "batch" and answer["failed"]:
        sys.stderr.write("consumer: %d of %d batch requests were refused\n" % (answer["failed"], len(answer["results"])))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
