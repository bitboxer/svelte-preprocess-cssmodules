import { walk } from 'estree-walker';
const updateMultipleClasses = (processor, classNames) => {
    const classes = classNames.split(' ');
    const generatedClassNames = classes.reduce((accumulator, currentValue, currentIndex) => {
        let value = currentValue;
        const rawValue = value.trim();
        if (rawValue in processor.cssModuleList) {
            value = value.replace(rawValue, processor.cssModuleList[rawValue]);
        }
        if (currentIndex < classes.length - 1) {
            value += ' ';
        }
        return `${accumulator}${value}`;
    }, '');
    return generatedClassNames;
};
const parseLiteralExpression = (processor, expression) => {
    const exp = expression;
    if (exp.type === 'Literal' && typeof exp.value === 'string') {
        const generatedClassNames = updateMultipleClasses(processor, exp.value);
        processor.magicContent.overwrite(exp.start, exp.end, `'${generatedClassNames}'`);
    }
};
const parseConditionalExpression = (processor, expression) => {
    if (expression.type === 'ConditionalExpression') {
        const { consequent, alternate } = expression;
        parseLiteralExpression(processor, consequent);
        parseLiteralExpression(processor, alternate);
    }
};
const parseObjectExpression = (processor, expression) => {
    if (expression.type === 'ObjectExpression') {
        expression?.properties.forEach((property) => {
            if (property.type === 'Property') {
                const key = property.key;
                if (property.shorthand) {
                    if (key.type === 'Identifier') {
                        processor.magicContent.overwrite(key.start, key.end, `'${processor.cssModuleList[key.name]}': ${key.name}`);
                    }
                }
                else if (key.type === 'Identifier') {
                    processor.magicContent.overwrite(key.start, key.end, `'${processor.cssModuleList[key.name]}'`);
                }
                else if (key.type !== 'PrivateIdentifier') {
                    parseLiteralExpression(processor, key);
                }
            }
        });
    }
};
const parseArrayExpression = (processor, expression) => {
    if (expression.type === 'ArrayExpression') {
        expression.elements.forEach((el) => {
            if (el?.type === 'LogicalExpression') {
                parseLiteralExpression(processor, el.right);
            }
            else if (el?.type !== 'SpreadElement') {
                parseLiteralExpression(processor, el);
            }
        });
    }
};
const addDynamicVariablesToElements = (processor, fragment, cssVar) => {
    fragment.nodes?.forEach((childNode) => {
        if (childNode.type === 'Component' || childNode.type === 'KeyBlock') {
            addDynamicVariablesToElements(processor, childNode.fragment, cssVar);
        }
        else if (childNode.type === 'EachBlock') {
            addDynamicVariablesToElements(processor, childNode.body, cssVar);
            if (childNode.fallback) {
                addDynamicVariablesToElements(processor, childNode.fallback, cssVar);
            }
        }
        else if (childNode.type === 'SnippetBlock') {
            addDynamicVariablesToElements(processor, childNode.body, cssVar);
        }
        else if (childNode.type === 'RegularElement') {
            const attributesLength = childNode.attributes.length;
            if (attributesLength) {
                const styleAttr = childNode.attributes.find((attr) => attr.type !== 'SpreadAttribute' && attr.type !== 'AttachTag' && attr.name === 'style');
                if (styleAttr && Array.isArray(styleAttr.value)) {
                    processor.magicContent.appendLeft(styleAttr.value[0].start, cssVar.values);
                }
                else {
                    const lastAttr = childNode.attributes[attributesLength - 1];
                    processor.magicContent.appendRight(lastAttr.end, ` ${cssVar.styleAttribute}`);
                }
            }
            else {
                processor.magicContent.appendRight(childNode.start + childNode.name.length + 1, ` ${cssVar.styleAttribute}`);
            }
        }
        else if (childNode.type === 'IfBlock') {
            addDynamicVariablesToElements(processor, childNode.consequent, cssVar);
            if (childNode.alternate) {
                addDynamicVariablesToElements(processor, childNode.alternate, cssVar);
            }
        }
        else if (childNode.type === 'AwaitBlock') {
            if (childNode.pending) {
                addDynamicVariablesToElements(processor, childNode.pending, cssVar);
            }
            if (childNode.then) {
                addDynamicVariablesToElements(processor, childNode.then, cssVar);
            }
            if (childNode.catch) {
                addDynamicVariablesToElements(processor, childNode.catch, cssVar);
            }
        }
    });
};
const cssVariables = (processor) => {
    const cssVarListKeys = Object.keys(processor.cssVarList);
    let styleAttribute = '';
    let values = '';
    if (cssVarListKeys.length) {
        for (let i = 0; i < cssVarListKeys.length; i += 1) {
            const key = cssVarListKeys[i];
            values += `--${processor.cssVarList[key]}:{${key}};`;
        }
        styleAttribute = `style="${values}"`;
    }
    return { styleAttribute, values };
};
export default (processor) => {
    const directiveLength = 'class:'.length;
    const allowedAttributes = ['class', ...processor.options.includeAttributes];
    const cssVar = cssVariables(processor);
    let dynamicVariablesAdded = false;
    walk(processor.ast.fragment, {
        enter(baseNode) {
            const node = baseNode;
            if (node.type === 'Fragment' && cssVar.values.length && !dynamicVariablesAdded) {
                dynamicVariablesAdded = true;
                addDynamicVariablesToElements(processor, node, cssVar);
            }
            if (['RegularElement', 'Component'].includes(node.type) &&
                node.attributes.length > 0) {
                node.attributes.forEach((item) => {
                    if (item.type === 'Attribute' && allowedAttributes.includes(item.name)) {
                        if (Array.isArray(item.value)) {
                            item.value.forEach((classItem) => {
                                if (classItem.type === 'Text' && classItem.data.length > 0) {
                                    const generatedClassNames = updateMultipleClasses(processor, classItem.data);
                                    processor.magicContent.overwrite(classItem.start, classItem.start + classItem.data.length, generatedClassNames);
                                }
                                else if (classItem.type === 'ExpressionTag') {
                                    parseConditionalExpression(processor, classItem.expression);
                                }
                            });
                        }
                        else if (typeof item.value === 'object' && item.value.type === 'ExpressionTag') {
                            parseObjectExpression(processor, item.value.expression);
                            parseArrayExpression(processor, item.value.expression);
                            parseConditionalExpression(processor, item.value.expression);
                        }
                    }
                    if (item.type === 'ClassDirective') {
                        const classNames = item.name.split('.');
                        const name = classNames.length > 1 ? classNames[1] : classNames[0];
                        if (name in processor.cssModuleList) {
                            const start = item.start + directiveLength;
                            const end = start + item.name.length;
                            if (item.expression.type === 'Identifier' && item.name === item.expression.name) {
                                processor.magicContent.overwrite(start, end, `${processor.cssModuleList[name]}={${item.name}}`);
                            }
                            else {
                                processor.magicContent.overwrite(start, end, processor.cssModuleList[name]);
                            }
                        }
                    }
                });
            }
        },
    });
};
