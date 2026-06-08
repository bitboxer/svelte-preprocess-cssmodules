import type { AST } from 'svelte/compiler';
export declare const normalizeIncludePaths: (paths: string[]) => string[];
export declare const isFileIncluded: (includePaths: string[], filename: string) => boolean;
export declare const hasModuleImports: (content: string) => boolean;
export declare const hasModuleAttribute: (ast: AST.Root) => boolean;
