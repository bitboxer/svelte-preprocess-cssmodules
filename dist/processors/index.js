"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopedProcessor = exports.mixedProcessor = exports.nativeProcessor = void 0;
var native_1 = require("./native");
Object.defineProperty(exports, "nativeProcessor", { enumerable: true, get: function () { return __importDefault(native_1).default; } });
var mixed_1 = require("./mixed");
Object.defineProperty(exports, "mixedProcessor", { enumerable: true, get: function () { return __importDefault(mixed_1).default; } });
var scoped_1 = require("./scoped");
Object.defineProperty(exports, "scopedProcessor", { enumerable: true, get: function () { return __importDefault(scoped_1).default; } });
