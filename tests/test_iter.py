# Copyright 2025 Softwell S.r.l. - Licensed under Apache License 2.0
"""Tests for to_tytx_iter / from_tytx_iter: iterables of objects in, iterators out."""

import json
from datetime import date, datetime, time, timezone
from decimal import Decimal

import pytest

from genro_tytx import from_tytx_iter, register_type, to_tytx, to_tytx_iter
from genro_tytx.registry import CUSTOM_TYPES, SUFFIX_TO_TYPE, TYPE_REGISTRY

RECORD = {
    "id": 1,
    "price": Decimal("12.50"),
    "day": date(2026, 10, 22),
    "at": datetime(2026, 10, 22, 10, 30, tzinfo=timezone.utc),
    "hour": time(10, 30),
    "note": "line1\nline2",
    "ratio": 0.5,
    "active": True,
    "missing": None,
    "rows": [Decimal("1.5"), {"due": date(2026, 1, 1)}],
}

ENCODED = {
    "id": 1,
    "price": "12.50::N",
    "day": "2026-10-22::D",
    "at": "2026-10-22T10:30:00.000Z::DHZ",
    "hour": "10:30:00.000::H",
    "note": "line1\nline2",
    "ratio": 0.5,
    "active": True,
    "missing": None,
    "rows": ["1.5::N", {"due": "2026-01-01::D"}],
}


class Point:
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y

    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)


@pytest.fixture
def point_type():
    """Register Point under "PT" and restore the registry afterwards."""
    type_snapshot = dict(TYPE_REGISTRY)
    suffix_snapshot = dict(SUFFIX_TO_TYPE)
    custom_snapshot = set(CUSTOM_TYPES)
    register_type(
        Point,
        "PT",
        lambda p: f"{p.x},{p.y}",
        lambda s: Point(*map(int, s.split(","))),
    )
    yield
    TYPE_REGISTRY.clear()
    TYPE_REGISTRY.update(type_snapshot)
    SUFFIX_TO_TYPE.clear()
    SUFFIX_TO_TYPE.update(suffix_snapshot)
    CUSTOM_TYPES.clear()
    CUSTOM_TYPES.update(custom_snapshot)


async def _aiterate(items):
    for item in items:
        yield item


class TestToTytxIter:
    """to_tytx_iter turns typed values into TYTX strings, record by record."""

    def test_encodes_typed_values(self):
        assert list(to_tytx_iter([RECORD])) == [ENCODED]

    def test_records_are_json_serialisable(self):
        """Each output record is plain JSON: one JSONL line with json.dumps."""
        line = json.dumps(next(to_tytx_iter([RECORD])))
        assert "\n" not in line
        assert json.loads(line) == ENCODED

    def test_matches_to_tytx_without_marker(self):
        expected = json.loads(to_tytx(RECORD).removesuffix("::JS"))
        assert next(to_tytx_iter([RECORD])) == expected

    def test_registered_type(self, point_type):
        assert list(to_tytx_iter([{"p": Point(1, 2)}])) == [{"p": "1,2::PT"}]

    def test_returns_an_iterator(self):
        records = to_tytx_iter([RECORD])
        assert iter(records) is records

    def test_consumes_the_source_one_record_at_a_time(self):
        consumed = []

        def source():
            for n in range(3):
                consumed.append(n)
                yield {"n": Decimal(n)}

        records = to_tytx_iter(source())
        assert next(records) == {"n": "0::N"}
        assert consumed == [0]

    async def test_async_source_gives_an_async_iterator(self):
        result = [record async for record in to_tytx_iter(_aiterate([RECORD, RECORD]))]
        assert result == [ENCODED, ENCODED]


class TestFromTytxIter:
    """from_tytx_iter turns TYTX strings back into typed values, record by record."""

    def test_decodes_typed_values(self):
        assert list(from_tytx_iter([ENCODED])) == [RECORD]

    def test_non_tytx_values_pass_unchanged(self):
        plain = {"s": "text", "colons": "a::b", "n": 3, "f": 1.5, "b": False, "z": None, "l": ["x"]}
        assert list(from_tytx_iter([plain])) == [plain]

    def test_registered_type(self, point_type):
        assert list(from_tytx_iter([{"p": "1,2::PT"}])) == [{"p": Point(1, 2)}]

    def test_records_from_json_lines(self):
        lines = [json.dumps(ENCODED), json.dumps({"id": 2})]
        assert list(from_tytx_iter(json.loads(line) for line in lines)) == [RECORD, {"id": 2}]

    def test_returns_an_iterator(self):
        records = from_tytx_iter([ENCODED])
        assert iter(records) is records

    def test_consumes_the_source_one_record_at_a_time(self):
        consumed = []

        def source():
            for n in range(3):
                consumed.append(n)
                yield {"n": f"{n}::N"}

        records = from_tytx_iter(source())
        assert next(records) == {"n": Decimal(0)}
        assert consumed == [0]

    def test_invalid_value_with_a_valid_code_raises(self):
        with pytest.raises(ArithmeticError):
            list(from_tytx_iter([{"price": "abc::N"}]))

    async def test_async_source_gives_an_async_iterator(self):
        result = [record async for record in from_tytx_iter(_aiterate([ENCODED, ENCODED]))]
        assert result == [RECORD, RECORD]


class TestRoundTrip:
    def test_sync(self):
        assert list(from_tytx_iter(to_tytx_iter([RECORD, {"id": 2}]))) == [RECORD, {"id": 2}]

    async def test_async(self):
        decoded = from_tytx_iter(to_tytx_iter(_aiterate([RECORD])))
        assert [record async for record in decoded] == [RECORD]
