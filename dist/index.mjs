import { parse } from 'svelte/compiler';
import { mixedProcessor, nativeProcessor, scopedProcessor } from './processors/index.mjs';
import { getLocalIdent, isFileIncluded, hasModuleImports, hasModuleAttribute, normalizeIncludePaths, } from './lib/index.mjs';
const defaultOptions = () => {
    return {
        cssVariableHash: '[hash:base64:6]',
        getLocalIdent,
        hashSeeder: ['style', 'filepath', 'classname'],
        includeAttributes: [],
        includePaths: [],
        localIdentName: '[local]-[hash:base64:6]',
        mode: 'native',
        parseExternalStylesheet: false,
        parseStyleTag: true,
        useAsDefaultScoping: false,
    };
};
let pluginOptions;
const markup = async ({ content, filename }) => {
    if (!filename ||
        !isFileIncluded(pluginOptions.includePaths, filename) ||
        (!pluginOptions.parseStyleTag && !pluginOptions.parseExternalStylesheet)) {
        return { code: content };
    }
    let ast;
    try {
        ast = parse(content, { modern: true, filename });
    }
    catch (err) {
        throw new Error(`${err}\n\nThe svelte component failed to be parsed.`);
    }
    if (!pluginOptions.useAsDefaultScoping &&
        !hasModuleAttribute(ast) &&
        !hasModuleImports(content)) {
        return { code: content };
    }
    let { mode, hashSeeder } = pluginOptions;
    if (pluginOptions.parseStyleTag && hasModuleAttribute(ast)) {
        const moduleAttribute = ast.css?.attributes.find((item) => item.name === 'module');
        mode = moduleAttribute.value !== true ? moduleAttribute.value[0].data : mode;
    }
    if (!['native', 'mixed', 'scoped'].includes(mode)) {
        throw new Error(`Module only accepts 'native', 'mixed' or 'scoped': '${mode}' was passed.`);
    }
    hashSeeder.forEach((value) => {
        if (!['style', 'filepath', 'classname'].includes(value)) {
            throw new Error(`The hash seeder only accepts the keys 'style', 'filepath' and 'classname': '${value}' was passed.`);
        }
    });
    let processor = nativeProcessor;
    if (mode === 'mixed') {
        processor = mixedProcessor;
    }
    else if (mode === 'scoped') {
        processor = scopedProcessor;
    }
    const parsedContent = await processor(ast, content, filename, pluginOptions);
    return { code: parsedContent };
};
const cssModulesPreprocessor = (options = {}) => {
    pluginOptions = {
        ...defaultOptions(),
        ...options,
    };
    if (pluginOptions.includePaths) {
        pluginOptions.includePaths = normalizeIncludePaths(pluginOptions.includePaths);
    }
    return {
        markup,
    };
};
export default cssModulesPreprocessor;
export const cssModules = cssModulesPreprocessor;
