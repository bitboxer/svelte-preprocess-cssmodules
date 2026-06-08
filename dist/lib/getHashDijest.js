"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const big_js_1 = __importDefault(require("big.js"));
const crypto_1 = require("crypto");
const baseEncodeTables = {
    26: 'abcdefghijklmnopqrstuvwxyz',
    32: '123456789abcdefghjkmnpqrstuvwxyz',
    36: '0123456789abcdefghijklmnopqrstuvwxyz',
    49: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    52: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    58: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
};
const encodeBufferToBase = (buffer, base) => {
    const baseEncondingNumber = base;
    const encodeTable = baseEncodeTables[baseEncondingNumber];
    if (!encodeTable) {
        throw new Error(`Unknown encoding base${base}`);
    }
    const readLength = buffer.length;
    big_js_1.default.DP = 0;
    big_js_1.default.RM = big_js_1.default.DP;
    let big = new big_js_1.default(0);
    for (let i = readLength - 1; i >= 0; i -= 1) {
        big = big.times(256).plus(buffer[i]);
    }
    let output = '';
    while (big.gt(0)) {
        const modulo = big.mod(base);
        output = encodeTable[modulo] + output;
        big = big.div(base);
    }
    big_js_1.default.DP = 20;
    big_js_1.default.RM = 1;
    return output;
};
const getHashDigest = (buffer, hashType, digestType, maxLength = 9999) => {
    const hash = (0, crypto_1.createHash)(hashType || 'md5');
    hash.update(buffer);
    if (digestType === 'base26' ||
        digestType === 'base32' ||
        digestType === 'base36' ||
        digestType === 'base49' ||
        digestType === 'base52' ||
        digestType === 'base58' ||
        digestType === 'base62' ||
        digestType === 'base64') {
        return encodeBufferToBase(hash.digest(), parseInt(digestType.substring(4), 10)).substring(0, maxLength);
    }
    const encoding = digestType || 'hex';
    return hash.digest(encoding).substring(0, maxLength);
};
exports.default = getHashDigest;
