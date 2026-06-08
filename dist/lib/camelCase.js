"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const camelCase = (str) => {
    const strings = str.split('-');
    return strings.reduce((acc, val) => {
        return `${acc}${val[0].toUpperCase()}${val.slice(1)}`;
    });
};
exports.default = camelCase;
