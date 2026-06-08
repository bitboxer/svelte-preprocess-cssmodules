"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importStar(require("fs"));
const magic_string_1 = __importDefault(require("magic-string"));
const compiler_1 = require("svelte/compiler");
const estree_walker_1 = require("estree-walker");
exports.default = (processor) => {
    if (!processor.ast.instance) {
        return;
    }
    const backup = Object.assign({}, processor);
    let importedContent = '';
    (0, estree_walker_1.walk)(processor.ast.instance, {
        enter(baseNode) {
            var _a;
            (_a = baseNode.content) === null || _a === void 0 ? void 0 : _a.body.forEach((node) => {
                var _a;
                if (node.type === 'ImportDeclaration' &&
                    ((_a = String(node.source.value)) === null || _a === void 0 ? void 0 : _a.search(/\.module\.s?css$/)) !== -1) {
                    const nodeBody = node;
                    const sourceValue = String(nodeBody.source.value);
                    const absolutePath = path_1.default.resolve(path_1.default.dirname(processor.filename), sourceValue);
                    const nodeModulesPath = path_1.default.resolve(`${path_1.default.resolve()}/node_modules`, sourceValue);
                    try {
                        processor.importedCssModuleList = {};
                        const fileContent = fs_1.default.readFileSync(absolutePath, 'utf8');
                        const fileStyle = `${processor.style.openTag}${fileContent}${processor.style.closeTag}`;
                        let fileMagicContent = new magic_string_1.default(fileStyle);
                        processor.ast = (0, compiler_1.parse)(fileStyle, {
                            filename: absolutePath,
                            modern: true,
                        });
                        processor.magicContent = fileMagicContent;
                        processor.cssKeyframeList = {};
                        processor.cssAnimationProperties = [];
                        processor.styleParser(processor);
                        fileMagicContent = processor.magicContent;
                        processor.ast = backup.ast;
                        processor.magicContent = backup.magicContent;
                        processor.cssKeyframeList = backup.cssKeyframeList;
                        processor.cssAnimationProperties = backup.cssAnimationProperties;
                        if (nodeBody.specifiers.length === 0) {
                            processor.magicContent.remove(nodeBody.start, nodeBody.end);
                        }
                        else if (nodeBody.specifiers[0].type === 'ImportDefaultSpecifier') {
                            const specifiers = `const ${nodeBody.specifiers[0].local.name} = ${JSON.stringify(processor.importedCssModuleList)};`;
                            processor.magicContent.overwrite(nodeBody.start, nodeBody.end, specifiers);
                        }
                        else {
                            const specifierNames = nodeBody.specifiers.map((item) => {
                                return item.local.name;
                            });
                            const specifiers = `const { ${specifierNames.join(', ')} } = ${JSON.stringify(Object.fromEntries(Object.entries(processor.importedCssModuleList).filter(([key]) => specifierNames.includes(key))))};`;
                            processor.magicContent.overwrite(nodeBody.start, nodeBody.end, specifiers);
                        }
                        const content = `\n${fileMagicContent
                            .toString()
                            .replace(processor.style.openTag, '')
                            .replace(processor.style.closeTag, '')}`;
                        if (processor.style.ast) {
                            processor.magicContent.prependLeft(processor.style.ast.content.start, content);
                        }
                        else {
                            importedContent += content;
                        }
                    }
                    catch (err) {
                        fs_1.default.access(nodeModulesPath, fs_1.constants.F_OK, (error) => {
                            if (error) {
                                throw new Error(err);
                            }
                        });
                    }
                }
            });
        },
    });
    if (importedContent) {
        processor.magicContent.append(`${processor.style.openTag}${importedContent}${processor.style.closeTag}`);
    }
};
