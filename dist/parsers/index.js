"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTemplate = exports.parseImportDeclaration = void 0;
var importDeclaration_1 = require("./importDeclaration");
Object.defineProperty(exports, "parseImportDeclaration", { enumerable: true, get: function () { return __importDefault(importDeclaration_1).default; } });
var template_1 = require("./template");
Object.defineProperty(exports, "parseTemplate", { enumerable: true, get: function () { return __importDefault(template_1).default; } });
