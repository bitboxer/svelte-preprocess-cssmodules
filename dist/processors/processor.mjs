import MagicString from 'magic-string';
import { camelCase, createClassName, generateName, hasModuleAttribute, hasModuleImports, } from '../lib/index.mjs';
import { parseImportDeclaration, parseTemplate } from '../parsers/index.mjs';
export default class Processor {
    filename;
    options;
    rawContent;
    cssModuleList = {};
    cssVarList = {};
    cssKeyframeList = {};
    cssAnimationProperties = [];
    importedCssModuleList = {};
    ast;
    style;
    magicContent;
    styleParser;
    isParsingImports = false;
    constructor(ast, content, filename, options, parser) {
        this.filename = filename;
        this.options = options;
        this.rawContent = content;
        this.ast = ast;
        this.magicContent = new MagicString(content);
        this.styleParser = parser.bind(this);
        this.style = {
            ast: ast.css,
            openTag: ast.css ? content.substring(ast.css.start, ast.css.content.start) : '<style module>',
            closeTag: '</style>',
        };
    }
    createModuleClassname = (name) => {
        const generatedClassName = createClassName(this.filename, this.rawContent, this.ast.css?.content.styles ?? '', name, this.options);
        return generatedClassName;
    };
    addModule = (name, value) => {
        if (this.isParsingImports) {
            this.importedCssModuleList[camelCase(name)] = value;
        }
        this.cssModuleList[name] = value;
    };
    parse = () => {
        if (this.options.parseStyleTag &&
            (hasModuleAttribute(this.ast) || (this.options.useAsDefaultScoping && this.ast.css))) {
            this.isParsingImports = false;
            this.styleParser(this);
        }
        if (this.options.parseExternalStylesheet && hasModuleImports(this.rawContent)) {
            this.isParsingImports = true;
            parseImportDeclaration(this);
        }
        if (Object.keys(this.cssModuleList).length > 0 || Object.keys(this.cssVarList).length > 0) {
            parseTemplate(this);
        }
        return this.magicContent.toString();
    };
    parseBoundVariables = (node) => {
        const bindedVariableNodes = (node.children.filter((item) => item.type === 'Declaration' && item.value.includes('bind(')) ?? []);
        if (bindedVariableNodes.length > 0) {
            bindedVariableNodes.forEach((item) => {
                const name = item.value.replace(/'|"|bind\(|\)/g, '');
                const varName = name.replace(/\./, '-');
                const generatedVarName = generateName(this.filename, this.ast.css?.content.styles ?? '', varName, {
                    hashSeeder: ['style', 'filepath'],
                    localIdentName: `[local]-${this.options.cssVariableHash}`,
                });
                const bindStart = item.end - item.value.length;
                this.magicContent.overwrite(bindStart, item.end, `var(--${generatedVarName})`);
                this.cssVarList[name] = generatedVarName;
            });
        }
    };
    parseKeyframes = (node) => {
        if (node.prelude.indexOf('-global-') === -1) {
            const animationName = this.createModuleClassname(node.prelude);
            if (node.block?.end) {
                this.magicContent.overwrite(node.start, node.block.start - 1, `@keyframes -global-${animationName}`);
                this.cssKeyframeList[node.prelude] = animationName;
            }
        }
    };
    parseClassSelectors = (node) => {
        if (node.type === 'ClassSelector') {
            const generatedClassName = this.createModuleClassname(node.name);
            this.addModule(node.name, generatedClassName);
            this.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
        }
    };
    parsePseudoLocalSelectors = (node) => {
        if (node.type === 'PseudoClassSelector' && node.name === 'local') {
            this.magicContent.remove(node.start, node.start + `:local(`.length);
            this.magicContent.remove(node.end - 1, node.end);
        }
    };
    storeAnimationProperties = (node) => {
        const animationNodes = (node.children.filter((item) => item.type === 'Declaration' && ['animation', 'animation-name'].includes(item.property)) ?? []);
        if (animationNodes.length > 0) {
            this.cssAnimationProperties.push(...animationNodes);
        }
    };
    overwriteAnimationProperties = () => {
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
}
