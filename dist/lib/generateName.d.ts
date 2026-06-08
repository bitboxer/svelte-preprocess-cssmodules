import type { PluginOptions } from '../types';
export declare function generateName(resourcePath: string, style: string, className: string, pluginOptions: Pick<PluginOptions, 'localIdentName' | 'hashSeeder'>): string;
export declare function createClassName(filename: string, markup: string, style: string, className: string, pluginOptions: PluginOptions): string;
