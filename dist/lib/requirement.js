"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasModuleAttribute = exports.hasModuleImports = exports.isFileIncluded = exports.normalizeIncludePaths = void 0;
const path_1 = __importDefault(require("path"));
const normalizePath = (filepath) => path_1.default.sep === '\\' ? filepath.replace(/\\/g, '/') : filepath;
const normalizeIncludePaths = (paths) => paths.map((includePath) => normalizePath(path_1.default.resolve(includePath)));
exports.normalizeIncludePaths = normalizeIncludePaths;
const isFileIncluded = (includePaths, filename) => {
    if (includePaths.length < 1) {
        return true;
    }
    return includePaths.some((includePath) => filename.startsWith(includePath));
};
exports.isFileIncluded = isFileIncluded;
const hasModuleImports = (content) => {
    const pattern = /(?<!\/\/\s*)import\s*(?:(.+)\s+from\s+)?['|"](.+?(module\.s?css))['|"];?/gm;
    return content.search(pattern) !== -1;
};
exports.hasModuleImports = hasModuleImports;
const hasModuleAttribute = (ast) => {
    var _a;
    const moduleAttribute = (_a = ast === null || ast === void 0 ? void 0 : ast.css) === null || _a === void 0 ? void 0 : _a.attributes.find((item) => item.name === 'module');
    return moduleAttribute !== undefined;
};
exports.hasModuleAttribute = hasModuleAttribute;
