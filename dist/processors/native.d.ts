import type { AST } from 'svelte/compiler';
import type { PluginOptions } from '../types';
declare const nativeProcessor: (ast: AST.Root, content: string, filename: string, options: PluginOptions) => Promise<string>;
export default nativeProcessor;
