"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const magic_string_1 = __importDefault(require("magic-string"));
const lib_1 = require("../lib");
const parsers_1 = require("../parsers");
class Processor {
    constructor(ast, content, filename, options, parser) {
        this.cssModuleList = {};
        this.cssVarList = {};
        this.cssKeyframeList = {};
        this.cssAnimationProperties = [];
        this.importedCssModuleList = {};
        this.isParsingImports = false;
        this.createModuleClassname = (name) => {
            var _a, _b;
            const generatedClassName = (0, lib_1.createClassName)(this.filename, this.rawContent, (_b = (_a = this.ast.css) === null || _a === void 0 ? void 0 : _a.content.styles) !== null && _b !== void 0 ? _b : '', name, this.options);
            return generatedClassName;
        };
        this.addModule = (name, value) => {
            if (this.isParsingImports) {
                this.importedCssModuleList[(0, lib_1.camelCase)(name)] = value;
            }
            this.cssModuleList[name] = value;
        };
        this.parse = () => {
            if (this.options.parseStyleTag &&
                ((0, lib_1.hasModuleAttribute)(this.ast) || (this.options.useAsDefaultScoping && this.ast.css))) {
                this.isParsingImports = false;
                this.styleParser(this);
            }
            if (this.options.parseExternalStylesheet && (0, lib_1.hasModuleImports)(this.rawContent)) {
                this.isParsingImports = true;
                (0, parsers_1.parseImportDeclaration)(this);
            }
            if (Object.keys(this.cssModuleList).length > 0 || Object.keys(this.cssVarList).length > 0) {
                (0, parsers_1.parseTemplate)(this);
            }
            return this.magicContent.toString();
        };
        this.parseBoundVariables = (node) => {
            var _a;
            const bindedVariableNodes = ((_a = node.children.filter((item) => item.type === 'Declaration' && item.value.includes('bind('))) !== null && _a !== void 0 ? _a : []);
            if (bindedVariableNodes.length > 0) {
                bindedVariableNodes.forEach((item) => {
                    var _a, _b;
                    const name = item.value.replace(/'|"|bind\(|\)/g, '');
                    const varName = name.replace(/\./, '-');
                    const generatedVarName = (0, lib_1.generateName)(this.filename, (_b = (_a = this.ast.css) === null || _a === void 0 ? void 0 : _a.content.styles) !== null && _b !== void 0 ? _b : '', varName, {
                        hashSeeder: ['style', 'filepath'],
                        localIdentName: `[local]-${this.options.cssVariableHash}`,
                    });
                    const bindStart = item.end - item.value.length;
                    this.magicContent.overwrite(bindStart, item.end, `var(--${generatedVarName})`);
                    this.cssVarList[name] = generatedVarName;
                });
            }
        };
        this.parseKeyframes = (node) => {
            var _a;
            if (node.prelude.indexOf('-global-') === -1) {
                const animationName = this.createModuleClassname(node.prelude);
                if ((_a = node.block) === null || _a === void 0 ? void 0 : _a.end) {
                    this.magicContent.overwrite(node.start, node.block.start - 1, `@keyframes -global-${animationName}`);
                    this.cssKeyframeList[node.prelude] = animationName;
                }
            }
        };
        this.parseClassSelectors = (node) => {
            if (node.type === 'ClassSelector') {
                const generatedClassName = this.createModuleClassname(node.name);
                this.addModule(node.name, generatedClassName);
                this.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
            }
        };
        this.parsePseudoLocalSelectors = (node) => {
            if (node.type === 'PseudoClassSelector' && node.name === 'local') {
                this.magicContent.remove(node.start, node.start + `:local(`.length);
                this.magicContent.remove(node.end - 1, node.end);
            }
        };
        this.storeAnimationProperties = (node) => {
            var _a;
            const animationNodes = ((_a = node.children.filter((item) => item.type === 'Declaration' && ['animation', 'animation-name'].includes(item.property))) !== null && _a !== void 0 ? _a : []);
            if (animationNodes.length > 0) {
                this.cssAnimationProperties.push(...animationNodes);
            }
        };
        this.overwriteAnimationProperties = () => {
            this.cssAnimationProperties.forEach((item) => {
                Object.keys(this.cssKeyframeList).forEach((key) => {
                    const index = item.value.indexOf(key);
                    if (index > -1) {
                        const keyStart = item.end - item.value.length + index;
                        const keyEnd = keyStart + key.length;
                        this.magicContent.overwrite(keyStart, keyEnd, this.cssKeyframeList[key]);
                    }
                });
            });
        };
        this.filename = filename;
        this.options = options;
        this.rawContent = content;
        this.ast = ast;
        this.magicContent = new magic_string_1.default(content);
        this.styleParser = parser.bind(this);
        this.style = {
            ast: ast.css,
            openTag: ast.css ? content.substring(ast.css.start, ast.css.content.start) : '<style module>',
            closeTag: '</style>',
        };
    }
}
exports.default = Processor;
