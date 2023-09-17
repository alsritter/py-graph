import { ComfyDialog } from '../ui.js';
import { CanvasManager } from '../canvas-manager/index.js';
export declare class Logger implements Module {
    #private;
    private canvasManager;
    setup(config: {
        canvasManager: CanvasManager;
    }): void;
    entries: Array<{
        source: string;
        type: string;
        timestamp: Date;
        message: any;
    }>;
    dialog: ComfyLoggingDialog;
    get enabled(): boolean;
    set enabled(value: boolean);
    constructor();
    addSetting(): void;
    patchConsole(): void;
    unpatchConsole(): void;
    catchUnhandled(): void;
    clear(): void;
    addEntry(source: string, type: string, ...args: {
        UserAgent?: string;
        MissingNodes?: any[];
    }[]): void;
    log(source: any, ...args: any[]): void;
    addInitData(): Promise<void>;
}
declare class ComfyLoggingDialog extends ComfyDialog {
    logging: Logger;
    constructor(logging: Logger);
    clear(): void;
    export(): void;
    import(): void;
    createButtons(): CustomElement[];
    getTypeColor(type: any): "red" | "orange" | "dodgerblue";
    show(entries?: any): void;
}
export {};
