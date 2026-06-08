/// <reference types="node" />
declare const getHashDigest: (buffer: Buffer, hashType: string, digestType: string, maxLength?: number) => string;
export default getHashDigest;
