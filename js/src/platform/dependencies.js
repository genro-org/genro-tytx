// Copyright 2026 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0
// One statically analyzable codec graph for Node, Bun and browser bundlers.
import Decimal from 'decimal.js';
import Big from 'big.js';
import * as messagePack from '@msgpack/msgpack';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export const DecimalJS = Decimal;
export const BigJS = Big;
export const msgpack = messagePack;
export const NodeDOMParser = DOMParser;
export const NodeXMLSerializer = XMLSerializer;
