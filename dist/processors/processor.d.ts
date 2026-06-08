import MagicString from 'magic-string';
import type { AST } from 'svelte/compiler';
import { CSSModuleList, PluginOptions } from '../types';
export default class Processor {
    filename: string;
    options: PluginOptions;
    rawContent: string;
    cssModuleList: CSSModuleList;
    cssVarList: CSSModuleList;
    cssKeyframeList: CSSModuleList;
    cssAnimationProperties: AST.CSS.Declaration[];
    importedCssModuleList: CSSModuleList;
    ast: AST.Root;
    style: {
        ast?: AST.Root['css'];
        openTag: string;
        closeTag: string;
    };
    magicContent: MagicString;
    styleParser: (param: Processor) => void;
    isParsingImports: boolean;
    constructor(ast: AST.Root, content: string, filename: string, options: PluginOptions, parser: (param: Processor) => void);
    createModuleClassname: (name: string) => string;
    addModule: (name: string, value: string) => void;
    parse: () => string;
    parseBoundVariables: (node: AST.CSS.Block) => void;
    parseKeyframes: (node: AST.CSS.Atrule) => void;
    parseClassSelectors: (node: AST.CSS.SimpleSelector) => void;
    parsePseudoLocalSelectors: (node: AST.CSS.SimpleSelector) => void;
    storeAnimationProperties: (node: AST.CSS.Block) => void;
    overwriteAnimationProperties: () => void;
}
