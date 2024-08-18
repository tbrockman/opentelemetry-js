export class ByteCountingTransformer extends TransformStream {

    private _bytes?: number;
    private _promise?: Promise<number | undefined>;
    private _resolve?: (value: number | undefined) => void;
    private _reject?: (reason?: any) => void;

    constructor() {
        super({
            start: () => {
                this._bytes = 0;
            },
            transform: (chunk, controller) => {
                this._bytes += chunk.length;
                controller.enqueue(chunk);
            },
            flush: () => {
                this._resolve?.(this._bytes);
            }
        });

        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        })
    }

    async byteLength(timeout?: number): Promise<number | undefined> {
        if (this._promise) {
            const timer = setTimeout(() => {
                this._reject?.(`timed out after ${timeout}ms waiting for stream byte length`);
            }, timeout);

            this._bytes = await this._promise;
            clearTimeout(timer);
            this._promise = undefined;
        }
        return this._bytes;
    }
}