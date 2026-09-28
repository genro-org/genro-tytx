// Copyright 2026 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0
/** Supported wire transports; null selects suffix-encoded typed text. */
export type Transport = 'json' | 'xml' | 'msgpack' | null;
export type DecimalLibrary = 'decimal.js' | 'big.js' | 'number';
export interface EncodeOptions { raw?: boolean; qs?: boolean; _forceSuffix?: boolean; }
/** Serialize a value. MessagePack returns bytes; other transports return text. */
export function toTytx(value: unknown, transport?: Transport, options?: EncodeOptions): string | Uint8Array;
/** Decode typed text, XML or MessagePack. Registered decoders determine the result. */
export function fromTytx(data: string | Uint8Array | null, transport?: Transport): unknown;
export interface FetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
    body?: unknown;
    transport?: Exclude<Transport, null>;
    headers?: Record<string, string>;
}
export function fetchTytx(url: string, options?: FetchOptions): Promise<unknown>;
export function getTransport(contentType: string | null | undefined): Transport;
export const CONTENT_TYPES: { json: string; xml: string; msgpack: string };
export function isDecimal(value: unknown): boolean;
/** Returns an instance of the selected decimal library, or boxed Number. */
export function createDecimal(value: string | number): { toString(): string; valueOf(): string | number };
export function setDecimalLibrary(name: DecimalLibrary): void;
export function getDecimalLibrary(): DecimalLibrary;
export function registerType<T>(cls: new (...args: any[]) => T, suffix: string,
    serializer: (value: T) => string, deserializer: (value: string) => T,
    jsonNative?: boolean): void;
export interface RegisteredClass<T extends { toTytx(): string }> {
    new (...args: any[]): T;
    tytxSuffix: string;
    tytxJsonNative?: boolean;
    fromTytx(value: string): T;
}
export function registerClass<T extends { toTytx(): string }, C extends RegisteredClass<T>>(cls: C): C;
export function getRegisteredType(suffix: string): Function | null;
/** Stores the subtype dictionary of a suffix, replacing the previous one. */
export function setSubtypeDict(suffix: string, subtypes: Record<string, unknown>): void;
/** Returns the subtype dictionary of a suffix, or {} if none was set. */
export function getSubtypeDict(suffix: string): Record<string, unknown>;
export const __version__: string;
