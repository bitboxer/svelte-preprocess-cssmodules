import Processor from './processor.mjs';
const updateSelectorBoundaries = (boundaries, start, end) => {
    const selectorBoundaries = boundaries;
    const lastIndex = selectorBoundaries.length - 1;
    if (selectorBoundaries[lastIndex]?.end === start) {
        selectorBoundaries[lastIndex].end = end;
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
    let selectorBoundaries = [];
    const visitNode = (node) => {
        if (node.type === 'Atrule') {
            if (node.name === 'keyframes') {
                processor.parseKeyframes(node);
                return;
            }
            node.block?.children?.forEach(visitNode);
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
            node.block?.children?.forEach((child) => {
                if (child.type === 'Rule' || child.type === 'Atrule') {
                    visitNode(child);
                }
            });
        }
    };
    processor.ast.css?.children?.forEach(visitNode);
    processor.overwriteAnimationProperties();
    selectorBoundaries.forEach((boundary) => {
        processor.magicContent.appendLeft(boundary.start, ':global(');
        processor.magicContent.appendRight(boundary.end, ')');
    });
};
const nativeProcessor = async (ast, content, filename, options) => {
    const processor = new Processor(ast, content, filename, options, parser);
    const processedContent = processor.parse();
    return processedContent;
};
export default nativeProcessor;
