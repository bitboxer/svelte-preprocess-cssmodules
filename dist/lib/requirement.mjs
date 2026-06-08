import path from 'path';
const normalizePath = (filepath) => path.sep === '\\' ? filepath.replace(/\\/g, '/') : filepath;
export const normalizeIncludePaths = (paths) => paths.map((includePath) => normalizePath(path.resolve(includePath)));
export const isFileIncluded = (includePaths, filename) => {
    if (includePaths.length < 1) {
        return true;
    }
    return includePaths.some((includePath) => filename.startsWith(includePath));
};
export const hasModuleImports = (content) => {
    const pattern = /(?<!\/\/\s*)import\s*(?:(.+)\s+from\s+)?['|"](.+?(module\.s?css))['|"];?/gm;
    return content.search(pattern) !== -1;
};
export const hasModuleAttribute = (ast) => {
    const moduleAttribute = ast?.css?.attributes.find((item) => item.name === 'module');
    return moduleAttribute !== undefined;
};
