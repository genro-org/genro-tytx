# Changelog

Notable changes to genro-tytx. Started at 0.12.2; earlier releases are
documented by their git tags and commit history.

## [0.16.2] - 2026-10-04

### Changed

- `js/src/index.d.ts` documents every exported symbol and member, with a module
  doc. No type or runtime change.
- The JSR job of the publish workflow installs the npm dependencies the JSR
  publisher resolves, so the JSR version is published from the workflow with
  provenance.

## [0.16.1] - 2026-10-01

### Changed

- The JavaScript package is published on npm as `@genrojs/tytx`, alongside JSR
  `@genro/tytx`. The unscoped npm package `genro-tytx` is deprecated.
- `@xmldom/xmldom` is required at `^0.9.12`, the line genro-bag-js uses, instead
  of `^0.8.10`. This closes the Dependabot alerts on 0.8.13, the version pinned
  by `js/package-lock.json`.
- Repository URLs point to `genro-org/genro-tytx`.

## [0.16.0] - 2026-09-26

### Changed

- An unregistered subclass of a type registered through `register_type` /
  `register_class` (`registerType` / `registerClass`) now travels under the
  suffix of its nearest registered ancestor, written by its own serializer,
  instead of raising `TypeError` (Python) or being walked as a plain object
  (JavaScript). The exact type still wins; built-in types keep the exact-type
  rule (spec §2.5). Refs #48.

### Added

- Subtype dictionaries: `set_subtype_dict(suffix, dict)` /
  `get_subtype_dict(suffix)` (JavaScript `setSubtypeDict` / `getSubtypeDict`).
  One dictionary per suffix; `set` replaces it, `get` returns `{}` when none
  was set. TYTX stores it and never reads it: the type that owns the suffix
  uses it to carry the concrete class (for `X`, genro-bag's `__cls`). Refs #48.

## [0.14.0] - 2026-09-06

### Added

- `RAW` type for bytes: Python `bytes`, JavaScript `Uint8Array`. Standard
  base64 under `::RAW` on JSON and XML (text and attributes); MessagePack
  native `bin`, no base64 and no extension code. Round trip byte-identical
  across the two languages (a Python test drives node on json and msgpack).
  For small binary values inside a message, not for files (spec §6.8).

- Type-code grammar: `register_type` / `registerType` (and the `register_class`
  / `registerClass` wrappers) now refuse a suffix that is not made of uppercase
  ASCII letters (`SUFFIX_PATTERN`, exported; no length limit). This is a new
  restriction: the registry used to accept any string. Every suffix registered
  in the indexed repositories (`X`, `BAG`, the test codes) conforms.
- Spec §2.5 "Registered Types and Reserved Codes": code grammar, exact-type lookup with one
  code per subclass (`X` for `Bag`, `XS` for `SourceBag`, `BAG` for the legacy
  Bag), opaque and possibly empty payloads, unknown codes returned untouched,
  the structural requirement on consumers that embed `"::CODE"` markers, and
  what an old `"::X"` marker does not say.
- Tests, Python and JavaScript, for the registered-subclass protocol across
  JSON, XML and MessagePack, and for the code grammar.

### Fixed

- CLAUDE.md pointed to `spec/type-codes.md`, which does not exist; the spec is
  `spec/TYTX-SPEC.md`.

### Known limits

- `qs` transport: bytes come out as base64 without percent-encoding
  (`b=YWI=::RAW`); the Python round trip works, but `=`, `+` and `/` are not
  protected in a real query string. The transport never percent-encoded any
  value, so this is pre-existing behaviour, not a regression.

## [0.13.0] - 2026-09-02

### Removed

- The HTTP request adapters (`asgi_data`, `wsgi_data`, `get_transport`,
  `TRANSPORT_MIME`, `MIME_TRANSPORT`) and the `genro_tytx.http` module.
  genro-tytx serializes and deserializes values; it does not read requests.

## [0.12.2] - 2026-08-06

### Fixed

- msgpack transport now honours registered custom types (`register_type` /
  `register_class`): a new extension type (ext code 4, payload
  `"SUFFIX:serialized"`, first-colon split) carries them over
  `transport="msgpack"`, which previously raised
  `TypeError: Unknown type`. Unknown suffixes on the receiving side degrade
  to the string `"serialized::SUFFIX"`, matching the JSON path. Implemented
  in both the Python package and the JS client; spec updated
  (`spec/TYTX-SPEC.md` §6).
