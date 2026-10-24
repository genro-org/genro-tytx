/* @ts-self-types="./index.d.ts" */
// Copyright 2025 Softwell S.r.l. - Licensed under Apache License 2.0
/**
 * TYTX Base - Typed Text Protocol for Scalar Types
 *
 * Minimal implementation supporting:
 * - Scalar types: Decimal, date, datetime, time, bool, int
 * - Encoders/Decoders: JSON, XML, MessagePack
 *
 * Usage:
 *     import { toTytx, fromTytx, fetchTytx } from '@genrojs/tytx';
 *     import Big from 'big.js';
 *
 *     // Encode
 *     const data = {"price": new Big("100.50"), "date": new Date(Date.UTC(2025, 0, 15))};
 *     const jsonStr = toTytx(data);
 *     // '{"price": "100.50::N", "date": "2025-01-15::D"}::JS'
 *
 *     // Decode
 *     const result = fromTytx(jsonStr);
 *     // {"price": Big("100.50"), "date": Date}
 */

import {
    isDecimal,
    createDecimal,
    setDecimalLibrary,
    getDecimalLibrary,
    getDateType,
    registerType,
    registerClass,
    getRegisteredType,
    setSubtypeDict,
    getSubtypeDict,
    registerSubtype,
} from './registry.js';

import { toTytx, toTytxIter } from './encode.js';
import { fromTytx, fromTytxIter } from './decode.js';
import { fetchTytx, getTransport, CONTENT_TYPES } from './http.js';

const __version__ = '0.16.3';

export {
    // Core API
    toTytx,
    fromTytx,
    // Iterables of objects (one record at a time)
    toTytxIter,
    fromTytxIter,
    // HTTP utilities
    fetchTytx,
    getTransport,
    CONTENT_TYPES,
    // Decimal utilities
    isDecimal,
    createDecimal,
    setDecimalLibrary,
    getDecimalLibrary,
    // Date type detection
    getDateType,
    // Custom type registration
    registerType,
    registerClass,
    getRegisteredType,
    setSubtypeDict,
    getSubtypeDict,
    registerSubtype,
    // Version
    __version__,
};
