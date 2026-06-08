"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClassName = exports.generateName = void 0;
const path_1 = __importDefault(require("path"));
const getHashDijest_1 = __importDefault(require("./getHashDijest"));
const PATTERN_PATH_UNALLOWED = /[<>:"/\\|?*]/g;
function interpolateName(resourcePath, localName, content) {
    const filename = localName || '[hash].[ext]';
    let ext = 'svelte';
    let basename = 'file';
    let directory = '';
    let folder = '';
    const parsed = path_1.default.parse(resourcePath);
    let composedResourcePath = resourcePath;
    if (parsed.ext) {
        ext = parsed.ext.substr(1);
    }
    if (parsed.dir) {
        basename = parsed.name;
        composedResourcePath = parsed.dir + path_1.default.sep;
    }
    directory = composedResourcePath.replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1');
    if (directory.length === 1) {
        directory = '';
    }
    else if (directory.length > 1) {
        folder = path_1.default.basename(directory);
    }
    let url = filename;
    if (content) {
        url = url.replace(/\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi, (all, hashType, digestType, maxLength) => (0, getHashDijest_1.default)(content, hashType, digestType, parseInt(maxLength, 10)));
    }
    return url
        .replace(/\[ext\]/gi, () => ext)
        .replace(/\[name\]/gi, () => basename)
        .replace(/\[path\]/gi, () => directory)
        .replace(/\[folder\]/gi, () => folder);
}
function generateName(resourcePath, style, className, pluginOptions) {
    const filePath = resourcePath;
    const localName = pluginOptions.localIdentName.length
        ? pluginOptions.localIdentName.replace(/\[local\]/gi, () => className)
        : className;
    const hashSeeder = pluginOptions.hashSeeder
        .join('-')
        .replace(/style/gi, () => style)
        .replace(/filepath/gi, () => filePath)
        .replace(/classname/gi, () => className);
    let interpolatedName = interpolateName(resourcePath, localName, hashSeeder).replace(/\./g, '-');
    if (PATTERN_PATH_UNALLOWED.test(interpolatedName)) {
        interpolatedName = interpolatedName.replace(PATTERN_PATH_UNALLOWED, '_');
    }
    if (/^(?![a-zA-Z_])/.test(interpolatedName)) {
        interpolatedName = `_${interpolatedName}`;
    }
    if (interpolatedName.slice(-1) === '-') {
        interpolatedName = interpolatedName.slice(0, -1);
    }
    return interpolatedName;
}
exports.generateName = generateName;
function createClassName(filename, markup, style, className, pluginOptions) {
    const interpolatedName = generateName(filename, style, className, pluginOptions);
    return pluginOptions.getLocalIdent({
        context: path_1.default.dirname(filename),
        resourcePath: filename,
    }, {
        interpolatedName,
        template: pluginOptions.localIdentName,
    }, className, {
        markup,
        style,
    });
}
exports.createClassName = createClassName;
