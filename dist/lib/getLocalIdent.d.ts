interface Context {
    context: string;
    resourcePath: string;
}
interface LocalIdentName {
    template: string;
    interpolatedName: string;
}
interface Options {
    markup: string;
    style: string;
}
export type GetLocalIdent = {
    (context: Context, localIdentName: LocalIdentName, localName: string, options: Options): string;
};
export declare const getLocalIdent: GetLocalIdent;
export {};
