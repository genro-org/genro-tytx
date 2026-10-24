// Copyright 2025 Softwell S.r.l. - Licensed under Apache License 2.0
/**
 * Tests for toTytxIter / fromTytxIter: iterables of objects in, iterators out.
 */

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';

import { toTytx, toTytxIter, fromTytxIter, getTransport, createDecimal, isDecimal } from '../src/index.js';
import { registerType, _resetCustomTypes } from '../src/registry.js';
import { tytxEquivalent } from '../src/utils.js';

const record = () => ({
    id: 1,
    price: createDecimal('12.5'),
    day: new Date(Date.UTC(2026, 9, 22)),
    at: new Date(Date.UTC(2026, 9, 22, 10, 30)),
    hour: new Date(Date.UTC(1970, 0, 1, 10, 30)),
    note: 'line1\nline2',
    ratio: 0.5,
    active: true,
    missing: null,
    rows: [createDecimal('1.5'), { due: new Date(Date.UTC(2026, 0, 1)) }],
});

const ENCODED = {
    id: 1,
    price: '12.5::N',
    day: '2026-10-22::D',
    at: '2026-10-22T10:30:00.000Z::DHZ',
    hour: '10:30:00.000::H',
    note: 'line1\nline2',
    ratio: 0.5,
    active: true,
    missing: null,
    rows: ['1.5::N', { due: '2026-01-01::D' }],
};

class Point {
    constructor(x, y) { this.x = x; this.y = y; }
}

const registerPoint = () => registerType(
    Point, 'PT', p => `${p.x},${p.y}`, s => new Point(...s.split(',').map(Number)),
);

async function* aiterate(items) {
    for (const item of items) yield item;
}

async function collect(asyncIterator) {
    const result = [];
    for await (const item of asyncIterator) result.push(item);
    return result;
}

describe('toTytxIter', () => {
    afterEach(() => _resetCustomTypes());

    test('encodes typed values', () => {
        assert.deepStrictEqual([...toTytxIter([record()])], [ENCODED]);
    });

    test('records are JSON serialisable on one line', () => {
        const line = JSON.stringify(toTytxIter([record()]).next().value);
        assert.ok(!line.includes('\n'));
        assert.deepStrictEqual(JSON.parse(line), ENCODED);
    });

    test('matches toTytx without the marker', () => {
        const expected = JSON.parse(toTytx(record()).replace(/::JS$/, ''));
        assert.deepStrictEqual(toTytxIter([record()]).next().value, expected);
    });

    test('registered type', () => {
        registerPoint();
        assert.deepStrictEqual([...toTytxIter([{ p: new Point(1, 2) }])], [{ p: '1,2::PT' }]);
    });

    test('consumes the source one record at a time', () => {
        const consumed = [];
        function* source() {
            for (let n = 0; n < 3; n++) { consumed.push(n); yield { n: createDecimal(String(n)) }; }
        }
        const records = toTytxIter(source());
        assert.deepStrictEqual(records.next().value, { n: '0::N' });
        assert.deepStrictEqual(consumed, [0]);
    });

    test('async source gives an async iterator', async () => {
        const records = toTytxIter(aiterate([record(), record()]));
        assert.ok(Symbol.asyncIterator in records);
        assert.deepStrictEqual(await collect(records), [ENCODED, ENCODED]);
    });
});

describe('fromTytxIter', () => {
    afterEach(() => _resetCustomTypes());

    test('decodes typed values', () => {
        const [decoded] = fromTytxIter([ENCODED]);
        assert.ok(isDecimal(decoded.price));
        assert.ok(tytxEquivalent(record(), decoded));
    });

    test('non-TYTX values pass unchanged', () => {
        const plain = { s: 'text', colons: 'a::b', n: 3, f: 1.5, b: false, z: null, l: ['x'] };
        assert.deepStrictEqual([...fromTytxIter([plain])], [plain]);
    });

    test('registered type', () => {
        registerPoint();
        const [decoded] = fromTytxIter([{ p: '1,2::PT' }]);
        assert.ok(decoded.p instanceof Point);
        assert.deepStrictEqual([decoded.p.x, decoded.p.y], [1, 2]);
    });

    test('records from JSON lines', () => {
        const lines = [JSON.stringify(ENCODED), JSON.stringify({ id: 2 })];
        const decoded = [...fromTytxIter(lines.map(line => JSON.parse(line)))];
        assert.ok(tytxEquivalent([record(), { id: 2 }], decoded));
    });

    test('consumes the source one record at a time', () => {
        const consumed = [];
        function* source() {
            for (let n = 0; n < 3; n++) { consumed.push(n); yield { n: `${n}::L` }; }
        }
        const records = fromTytxIter(source());
        assert.deepStrictEqual(records.next().value, { n: 0 });
        assert.deepStrictEqual(consumed, [0]);
    });

    test('async source gives an async iterator', async () => {
        const records = fromTytxIter(aiterate([ENCODED, ENCODED]));
        assert.ok(Symbol.asyncIterator in records);
        assert.ok(tytxEquivalent([record(), record()], await collect(records)));
    });
});

describe('round trip', () => {
    test('sync', () => {
        const decoded = [...fromTytxIter(toTytxIter([record(), { id: 2 }]))];
        assert.ok(tytxEquivalent([record(), { id: 2 }], decoded));
    });

    test('async', async () => {
        const decoded = await collect(fromTytxIter(toTytxIter(aiterate([record()]))));
        assert.ok(tytxEquivalent([record()], decoded));
    });
});

describe('getTransport with JSON Lines', () => {
    test('application/jsonl is jsonl, not json', () => {
        assert.strictEqual(getTransport('application/jsonl'), 'jsonl');
        assert.strictEqual(getTransport('application/jsonl; charset=utf-8'), 'jsonl');
        assert.strictEqual(getTransport('application/json'), 'json');
    });
});
