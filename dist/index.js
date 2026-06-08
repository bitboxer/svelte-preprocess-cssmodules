"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssModules = void 0;
const compiler_1 = require("svelte/compiler");
const processors_1 = require("./processors");
const lib_1 = require("./lib");
const defaultOptions = () => {
    return {
        cssVariableHash: '[hash:base64:6]',
        getLocalIdent: lib_1.getLocalIdent,
        hashSeeder: ['style', 'filepath', 'classname'],
        includeAttributes: [],
        includePaths: [],
        localIdentName: '[local]-[hash:base64:6]',
        mode: 'native',
        parseExternalStylesheet: false,
        parseStyleTag: true,
        useAsDefaultScoping: false,
    };
};
let pluginOptions;
const markup = ({ content, filename }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!filename ||
        !(0, lib_1.isFileIncluded)(pluginOptions.includePaths, filename) ||
        (!pluginOptions.parseStyleTag && !pluginOptions.parseExternalStylesheet)) {
        return { code: content };
    }
    let ast;
    try {
        ast = (0, compiler_1.parse)(content, { modern: true, filename });
    }
    catch (err) {
        throw new Error(`${err}\n\nThe svelte component failed to be parsed.`);
    }
    if (!pluginOptions.useAsDefaultScoping &&
        !(0, lib_1.hasModuleAttribute)(ast) &&
        !(0, lib_1.hasModuleImports)(content)) {
        return { code: content };
    }
    let { mode, hashSeeder } = pluginOptions;
    if (pluginOptions.parseStyleTag && (0, lib_1.hasModuleAttribute)(ast)) {
        const moduleAttribute = (_a = ast.css) === null || _a === void 0 ? void 0 : _a.attributes.find((item) => item.name === 'module');
        mode = moduleAttribute.value !== true ? moduleAttribute.value[0].data : mode;
    }
    if (!['native', 'mixed', 'scoped'].includes(mode)) {
        throw new Error(`Module only accepts 'native', 'mixed' or 'scoped': '${mode}' was passed.`);
    }
    hashSeeder.forEach((value) => {
        if (!['style', 'filepath', 'classname'].includes(value)) {
            throw new Error(`The hash seeder only accepts the keys 'style', 'filepath' and 'classname': '${value}' was passed.`);
        }
    });
    let processor = processors_1.nativeProcessor;
    if (mode === 'mixed') {
        processor = processors_1.mixedProcessor;
    }
    else if (mode === 'scoped') {
        processor = processors_1.scopedProcessor;
    }
    const parsedContent = yield processor(ast, content, filename, pluginOptions);
    return { code: parsedContent };
});
const cssModulesPreprocessor = (options = {}) => {
    pluginOptions = Object.assign(Object.assign({}, defaultOptions()), options);
    if (pluginOptions.includePaths) {
        pluginOptions.includePaths = (0, lib_1.normalizeIncludePaths)(pluginOptions.includePaths);
    }
    return {
        markup,
    };
};
exports.default = exports = module.exports = cssModulesPreprocessor;
exports.cssModules = cssModulesPreprocessor;
