import { walk } from 'estree-walker';
import Processor from './processor.mjs';
const updateSelectorBoundaries = (boundaries, start, end) => {
    const selectorBoundaries = boundaries;
    if (selectorBoundaries[selectorBoundaries.length - 1]?.end === start) {
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
    walk(processor.ast.css, {
        enter(baseNode) {
            baseNode.children?.forEach((node) => {
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
const mixedProcessor = async (ast, content, filename, options) => {
    const processor = new Processor(ast, content, filename, options, parser);
    const processedContent = processor.parse();
    return processedContent;
};
export default mixedProcessor;
