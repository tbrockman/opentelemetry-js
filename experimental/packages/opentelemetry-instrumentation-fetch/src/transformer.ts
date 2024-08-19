export class ByteCountingTransformer extends TransformStream {

    private _bytes?: number;
    private _promise?: Promise<number | undefined>;
    private _resolve?: (value: number | undefined) => void;
    private _reject?: (reason?: any) => void;

    constructor() {
        const transformer = {
            start: () => { },
            transform: (chunk: Uint8Array, controller: TransformStreamDefaultController) => { },
            flush: () => { }
        }

        super(transformer);

        transformer.start = () => {
            this._bytes = 0;
        }
        transformer.transform = (chunk: Uint8Array, controller: TransformStreamDefaultController) => {
            this._bytes! += chunk.length;
            controller.enqueue(chunk);
        }
        transformer.flush = () => {
            this._resolve?.(this._bytes);
        }

        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        })
    }

    async byteLength(timeout?: number): Promise<number | undefined> {
        if (this._promise) {
            const timer = timeout ? setTimeout(() => {
                this._reject?.(`timed out after ${timeout}ms waiting for stream byte length`);
            }, timeout) : undefined;

            this._bytes = await this._promise;
            timer && clearTimeout(timer);
            this._promise = undefined;
        }
        return this._bytes;
    }
}