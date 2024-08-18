import { ByteCountingTransformer } from "./transformer";
import { calculateRequestInitBodyLength } from "./util";

export class PatchedRequest extends Request {
    private _byteLengthPromise?: Promise<number | undefined>;
    private _byteLength?: number;

    constructor(input: RequestInfo | URL, init?: RequestInit) {
        // If the body is a stream, we need to count the bytes
        // So we replace it with a transform stream that counts chunks
        // We replace it before calling the super constructor, as afterwards the body is readonly
        if (init?.body instanceof ReadableStream) {
            const { readable } = new ByteCountingTransformer();
            init.body = readable;
        }
        // @ts-ignore
        super(input, init);

        // If we've received `init` and it has a body, we count its bytes
        if (init?.body) {
            this._byteLengthPromise = calculateRequestInitBodyLength(init)
        }
        // Otherwise, count the bytes of `input` if it's a PatchedRequest
        else {
            this._byteLengthPromise = input instanceof PatchedRequest ? input.byteLength() : undefined;
        }
    }

    async byteLength(): Promise<number | undefined> {
        if (this._byteLengthPromise) {
            this._byteLength = await this._byteLengthPromise;
            this._byteLengthPromise = undefined;
        }
        return this._byteLength;
    }
}