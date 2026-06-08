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
const estree_walker_1 = require("estree-walker");
const processor_1 = __importDefault(require("./processor"));
const updateSelectorBoundaries = (boundaries, start, end) => {
    var _a;
    const selectorBoundaries = boundaries;
    if (((_a = selectorBoundaries[selectorBoundaries.length - 1]) === null || _a === void 0 ? void 0 : _a.end) === start) {
        selectorBoundaries[selectorBoundaries.length - 1].end = end;
    }
    else {
        selectorBoundaries.push({ start, end });
    }
    return selectorBoundaries;
};
const parser = (processor) => {
    if (!processor.ast.css) {
        return;
    }
    (0, estree_walker_1.walk)(processor.ast.css, {
        enter(baseNode) {
            var _a;
            (_a = baseNode.children) === null || _a === void 0 ? void 0 : _a.forEach((node) => {
                if (node.type === 'Atrule' && node.name === 'keyframes') {
                    processor.parseKeyframes(node);
                    this.skip();
                }
                if (node.type === 'Rule') {
                    node.prelude.children.forEach((child) => {
                        child.children.forEach((grandChild) => {
                            if (grandChild.type === 'RelativeSelector') {
                                const classSelectors = grandChild.selectors.filter((item) => item.type === 'ClassSelector');
                                if (classSelectors.length > 0) {
                                    let selectorBoundaries = [];
                                    let start = 0;
                                    let end = 0;
                                    grandChild.selectors.forEach((item, index) => {
                                        if (!item.start && start > 0) {
                                            selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                                            start = 0;
                                            end = 0;
                                        }
                                        else {
                                            let hasPushed = false;
                                            if (end !== item.start) {
                                                start = item.start;
                                                end = item.end;
                                            }
                                            else {
                                                selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, item.end);
                                                hasPushed = true;
                                                start = 0;
                                                end = 0;
                                            }
                                            if (hasPushed === false &&
                                                grandChild.selectors &&
                                                index === grandChild.selectors.length - 1) {
                                                selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                                            }
                                        }
                                    });
                                    selectorBoundaries.forEach((boundary) => {
                                        const hasClassSelector = classSelectors.filter((item) => boundary.start <= item.start && boundary.end >= item.end);
                                        if (hasClassSelector.length > 0) {
                                            processor.magicContent.appendLeft(boundary.start, ':global(');
                                            processor.magicContent.appendRight(boundary.end, ')');
                                        }
                                    });
                                }
                                grandChild.selectors.forEach((item) => {
                                    processor.parsePseudoLocalSelectors(item);
                                    processor.parseClassSelectors(item);
                                });
                            }
                        });
                    });
                    processor.parseBoundVariables(node.block);
                    processor.storeAnimationProperties(node.block);
                }
            });
        },
    });
    processor.overwriteAnimationProperties();
};
const mixedProcessor = (ast, content, filename, options) => __awaiter(void 0, void 0, void 0, function* () {
    const processor = new processor_1.default(ast, content, filename, options, parser);
    const processedContent = processor.parse();
    return processedContent;
});
exports.default = mixedProcessor;
