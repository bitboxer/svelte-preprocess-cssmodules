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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const processor_1 = __importDefault(require("./processor"));
const updateSelectorBoundaries = (boundaries, start, end) => {
    var _a;
    const selectorBoundaries = boundaries;
    const lastIndex = selectorBoundaries.length - 1;
    if (((_a = selectorBoundaries[lastIndex]) === null || _a === void 0 ? void 0 : _a.end) === start) {
        selectorBoundaries[lastIndex].end = end;
    }
    else {
        selectorBoundaries.push({ start, end });
    }
    return selectorBoundaries;
};
const parser = (processor) => {
    var _a, _b;
    if (!processor.ast.css) {
        return;
    }
    let selectorBoundaries = [];
    const visitNode = (node) => {
        var _a, _b, _c, _d;
        if (node.type === 'Atrule') {
            if (node.name === 'keyframes') {
                processor.parseKeyframes(node);
                return;
            }
            (_b = (_a = node.block) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.forEach(visitNode);
            return;
        }
        if (node.type === 'Rule') {
            node.prelude.children.forEach((child) => {
                if (child.type === 'ComplexSelector') {
                    let start = 0;
                    let end = 0;
                    child.children.forEach((grandChild, index) => {
                        let hasPushed = false;
                        if (grandChild.type === 'RelativeSelector') {
                            grandChild.selectors.forEach((item) => {
                                if (item.type === 'PseudoClassSelector' &&
                                    (item.name === 'global' || item.name === 'local')) {
                                    processor.parsePseudoLocalSelectors(item);
                                    if (start > 0 && end > 0) {
                                        selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                                        hasPushed = true;
                                    }
                                    start = item.end + 1;
                                    end = 0;
                                }
                                else if (item.start && item.end) {
                                    if (start === 0) {
                                        start = item.start;
                                    }
                                    end = item.end;
                                    processor.parseClassSelectors(item);
                                }
                            });
                            if (hasPushed === false &&
                                child.children &&
                                index === child.children.length - 1 &&
                                end > 0) {
                                selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                            }
                        }
                    });
                }
            });
            processor.parseBoundVariables(node.block);
            processor.storeAnimationProperties(node.block);
            (_d = (_c = node.block) === null || _c === void 0 ? void 0 : _c.children) === null || _d === void 0 ? void 0 : _d.forEach((child) => {
                if (child.type === 'Rule' || child.type === 'Atrule') {
                    visitNode(child);
                }
            });
        }
    };
    (_b = (_a = processor.ast.css) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.forEach(visitNode);
    processor.overwriteAnimationProperties();
    selectorBoundaries.forEach((boundary) => {
        processor.magicContent.appendLeft(boundary.start, ':global(');
        processor.magicContent.appendRight(boundary.end, ')');
    });
};
const nativeProcessor = (ast, content, filename, options) => __awaiter(void 0, void 0, void 0, function* () {
    const processor = new processor_1.default(ast, content, filename, options, parser);
    const processedContent = processor.parse();
    return processedContent;
});
exports.default = nativeProcessor;
