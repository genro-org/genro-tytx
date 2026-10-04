// Copyright 2026 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

/**
 * @module
 *
 * TYTX: typed data interchange between Python and JavaScript over JSON, XML
 * and MessagePack. Decimal, dates and custom types arrive with their type.
 */

/** Supported wire transports; null selects suffix-encoded typed text. */
export type Transport = 'json' | 'xml' | 'msgpack' | null;

/** Name of a decimal implementation used to represent Decimal values. */
export type DecimalLibrary = 'decimal.js' | 'big.js' | 'number';

/** Options accepted by {@link toTytx}. */
export interface EncodeOptions {
    /** Emit the plain payload without TYTX type suffixes. */
    raw?: boolean;
    /** Emit a query string; the value must be a flat object or an array. */
    qs?: boolean;
    /** Internal: force a suffix on every typed value. */
    _forceSuffix?: boolean;
}

/** Serialize a value. MessagePack returns bytes; other transports return text. */
export function toTytx(value: unknown, transport?: Transport, options?: EncodeOptions): string | Uint8Array;

/** Decode typed text, XML or MessagePack. Registered decoders determine the result. */
export function fromTytx(data: string | Uint8Array | null, transport?: Transport): unknown;

/** Options accepted by {@link fetchTytx}: standard fetch options plus TYTX ones. */
export interface FetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
    /** Data to send, serialized with {@link toTytx}. Without it the method defaults to GET, with it to POST. */
    body?: unknown;
    /** Transport used to encode the request and, if the response does not declare one, to decode it. Defaults to 'json'. */
    transport?: Exclude<Transport, null>;
    /** Extra request headers. */
    headers?: Record<string, string>;
}

/**
 * Fetch a URL with TYTX encoding of the request body and decoding of the response.
 * Rejects when the response status is not ok.
 */
export function fetchTytx(url: string, options?: FetchOptions): Promise<unknown>;

/** Map a Content-Type header value to its transport, or null when it is not recognized. */
export function getTransport(contentType: string | null | undefined): Transport;

/** Content-Type header value of each non-null transport. */
export const CONTENT_TYPES: { json: string; xml: string; msgpack: string };

/** True when the value is an instance of the active decimal library. */
export function isDecimal(value: unknown): boolean;

/** Returns an instance of the selected decimal library, or boxed Number. */
export function createDecimal(value: string | number): { toString(): string; valueOf(): string | number };

/** Select the decimal library used to decode Decimal values. Falls back to 'number' when the library is not available. */
export function setDecimalLibrary(name: DecimalLibrary): void;

/** Returns the name of the decimal library currently in use. */
export function getDecimalLibrary(): DecimalLibrary;

/**
 * Register a class under a TYTX suffix, with explicit encoder and decoder.
 * Re-registering the same class replaces its hooks.
 * Throws if the suffix is not uppercase ASCII letters or belongs to another type.
 *
 * @param cls Class to register.
 * @param suffix TYTX suffix, uppercase ASCII letters.
 * @param serializer Converts an instance to its string form.
 * @param deserializer Rebuilds an instance from its string form.
 * @param jsonNative When true, JSON-native values are written without the suffix.
 */
export function registerType<T>(cls: new (...args: any[]) => T, suffix: string,
    serializer: (value: T) => string, deserializer: (value: string) => T,
    jsonNative?: boolean): void;

/** Shape of a class that carries its own TYTX hooks, accepted by {@link registerClass}. */
export interface RegisteredClass<T extends { toTytx(): string }> {
    /** Constructs an instance of the class. */
    new (...args: any[]): T;
    /** TYTX suffix of the class, uppercase ASCII letters. */
    tytxSuffix: string;
    /** When true, JSON-native values are written without the suffix. */
    tytxJsonNative?: boolean;
    /** Rebuilds an instance from the string produced by the instance's toTytx(). */
    fromTytx(value: string): T;
}

/** Register a class that declares its own hooks (tytxSuffix, toTytx, fromTytx). Returns the class, so it can be used as a decorator. */
export function registerClass<T extends { toTytx(): string }, C extends RegisteredClass<T>>(cls: C): C;

/** Returns the constructor registered for a suffix, or null, without running its decoder. */
export function getRegisteredType(suffix: string): Function | null;

/** Stores the subtype dictionary of a suffix, replacing the previous one. */
export function setSubtypeDict(suffix: string, subtypes: Record<string, unknown>): void;

/** Returns the subtype dictionary of a suffix, or {} if none was set. */
export function getSubtypeDict(suffix: string): Record<string, unknown>;

/** Version of the package. */
export const __version__: string;
