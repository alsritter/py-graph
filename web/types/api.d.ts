declare class ComfyApi extends EventTarget {
    #private;
    api_base: string;
    api_host: string;
    socket: WebSocket;
    clientId: string;
    constructor();
    apiURL(route: any): string;
    fetchApi(route: string, options?: {}): Promise<Response>;
    addEventListener(type: any, callback: any, options?: {}): void;
    init(): void;
    getNodeDefs(): Promise<any>;
    getExtensions(): Promise<any>;
    queueRunner(number: number, { output, workflow }: {
        output: any;
        workflow: any;
    }): Promise<any>;
}
export declare const api: ComfyApi;
export {};
