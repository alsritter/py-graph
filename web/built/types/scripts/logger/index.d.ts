import { ComfyDialog } from '../canvas-manager/ui.js';
export declare class Logger implements Module {
    #private;
    private canvasManager;
    constructor();
    init(config: ComfyCenter): void;
    setup(): void;
    entries: Array<{
        source: string;
        type: string;
        timestamp: Date;
        message: any;
    }>;
    dialog: ComfyLoggingDialog;
    get enabled(): boolean;
    set enabled(value: boolean);
    addSetting(): void;
    patchConsole(): void;
    unpatchConsole(): void;
    catchUnhandled(): void;
    clear(): void;
    addEntry(source: string, type: string, ...args: {
        UserAgent?: string;
        MissingNodes?: any[];
    }[]): void;
    log(source: string, ...args: any[]): void;
    addInitData(): Promise<void>;
    formatRunnerError(error: any): any;
    formatExecutionError(error: {
        traceback: any[];
        node_id: any;
        node_type: any;
        exception_message: any;
    }): string;
}
declare class ComfyLoggingDialog extends ComfyDialog {
    logging: Logger;
    fileInput: CustomElement;
    constructor(logging: Logger);
    clear(): void;
    export(): void;
    import(): void;
    createButtons(): CustomElement[];
    getTypeColor(type: any): "red" | "orange" | "dodgerblue";
    show(entries?: any): void;
}
export {};
