import type { ComfyApp } from './app.js';
export declare function addValueControlWidget(node: LGraphNode, targetWidget: IWidget, defaultValue?: string): IWidget<any, any>;
export declare const ComfyWidgets: {
    FLOAT(node: LGraphNode, inputName: any, inputData: any, app: any): {
        widget: IWidget<any, any>;
    };
    INT(node: any, inputName: any, inputData: any, app: any): {
        widget: any;
    };
    BOOLEAN(node: any, inputName: any, inputData: any): {
        widget: any;
    };
    STRING(node: any, inputName: any, inputData: any, app: any): any;
    COMBO(node: any, inputName: any, inputData: any, app: ComfyApp): {
        widget: any;
    };
    IMAGEUPLOAD(node: LGraphNode, inputName: any, inputData: any, app: ComfyApp): {
        widget: any;
    };
};
export type ComfyWidgetsType = typeof ComfyWidgets;
