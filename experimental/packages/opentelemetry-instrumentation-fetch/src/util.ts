import { ByteCountingTransformer } from "./transformer";

const TEXT_ENCODER = typeof TextEncoder == "function" ? new TextEncoder() : null;

export async function calculateRequestInitBodyLength(init: RequestInit): Promise<number | undefined> {
    let bytes: number | undefined = undefined;

    if (!init.body) return bytes;

    if (init.body instanceof ReadableStream) {

        if (init.body instanceof ByteCountingTransformer) {
            bytes = await init.body.byteLength();
        } else {
            console.error('`ReadableStream` body size cannot be determined without using a `ByteCountingTransformer`');
        }
    } else if (init.body instanceof Blob) {
        bytes = init.body.size;
    } else if (typeof init.body === 'string') {
        // Credit: https://github.com/smithy-lang/smithy-typescript/blob/main/packages/util-body-length-browser/src/calculateBodyLength.ts#L7
        if (TEXT_ENCODER) {
            bytes = TEXT_ENCODER.encode(init.body).byteLength;
        } else {
            let len = init.body.length;

            for (let i = len - 1; i >= 0; i--) {
                const code = init.body.charCodeAt(i);
                if (code > 0x7f && code <= 0x7ff) len++;
                else if (code > 0x7ff && code <= 0xffff) len += 2;
                if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
            }
            bytes = len
        }
    } else if (init.body instanceof FormData || init.body instanceof URLSearchParams) {
        // @ts-ignore
        bytes = Array.from(init.body.entries()).reduce((size, [name, value]) => size + (typeof value === 'string' ? value.length : value.size) + name.length, 0);
    }
    else if (typeof init.body?.byteLength === "number") {
        bytes = init.body.byteLength;
    } else {
        console.error('unsupported `RequestInit` body type', init.body);
    }
    return bytes;
}