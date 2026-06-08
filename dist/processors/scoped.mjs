import { walk } from 'estree-walker';
import Processor from './processor.mjs';
const parser = (processor) => {
    if (!processor.ast.css) {
        return;
    }
    walk(processor.ast.css, {
        enter(baseNode) {
            baseNode.children?.forEach((node) => {
                if (node.type === 'Rule') {
                    node.prelude.children.forEach((child) => {
                        child.children.forEach((grandChild) => {
                            if (grandChild.type === 'RelativeSelector') {
                                grandChild.selectors.forEach((item) => {
                                    processor.parsePseudoLocalSelectors(item);
                                    processor.parseClassSelectors(item);
                                });
                            }
                        });
                    });
                    processor.parseBoundVariables(node.block);
                }
            });
        },
    });
};
const scopedProcessor = async (ast, content, filename, options) => {
    const processor = new Processor(ast, content, filename, options, parser);
    const processedContent = processor.parse();
    return processedContent;
};
export default scopedProcessor;
