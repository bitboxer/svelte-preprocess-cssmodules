import type { AST } from 'svelte/compiler';
import type { PluginOptions } from '../types';
declare const mixedProcessor: (ast: AST.Root, content: string, filename: string, options: PluginOptions) => Promise<string>;
export default mixedProcessor;
