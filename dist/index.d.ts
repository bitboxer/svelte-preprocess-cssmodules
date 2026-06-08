import type { PreprocessorGroup } from 'svelte/compiler';
import type { PluginOptions } from './types';
declare const _default: (options?: Partial<PluginOptions>) => PreprocessorGroup;
export default _default;
export declare const cssModules: (options?: Partial<PluginOptions>) => PreprocessorGroup;
