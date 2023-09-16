declare class ComfyApi extends EventTarget {
    #private;
    api_base: string;
    api_host: string;
    socket: WebSocket;
    clientId: string;
    constructor();
    apiURL(route: string): string;
    fetchApi(route: string, options?: {}): Promise<Response>;
    addEventListener(type: string, callback: any, options?: {}): void;
    init(): void;
    getNodeDefs(): Promise<any>;
    getExtensions(): Promise<any>;
    queueRunner(number: number, { output, workflow }: {
        output: any;
        workflow: any;
    }): Promise<any>;
    getItems(type: string): Promise<{
        Running: any;
        Pending: any;
    } | {
        History: unknown[];
    }>;
    getQueue(): Promise<{
        Running: any;
        Pending: any;
    }>;
    getHistory(): Promise<{
        History: unknown[];
    }>;
    deleteItem(type: string, id: number): Promise<void>;
    clearItems(type: string): Promise<void>;
    interrupt(): Promise<void>;
    getSystemStats(): Promise<any>;
}
export declare const api: ComfyApi;
export {};
