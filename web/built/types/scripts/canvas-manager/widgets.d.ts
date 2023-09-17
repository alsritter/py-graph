export declare function addValueControlWidget(node: LGraphNode, targetWidget: IWidget, defaultValue?: string): IWidget<any, any>;
export declare const ComfyWidgets: {
    FLOAT(node: LGraphNode, inputName: any, inputData: any, app: ComfyCenter): {
        widget: IWidget<any, any>;
    };
    INT(node: any, inputName: any, inputData: any, app: any): {
        widget: any;
    };
    BOOLEAN(node: any, inputName: any, inputData: any): {
        widget: any;
    };
    STRING(node: LGraphNode, inputName: any, inputData: any, app: ComfyCenter): {
        widget: any;
        minWidth?: number;
        minHeight?: number;
    };
    COMBO(node: any, inputName: any, inputData: any, app: ComfyCenter): {
        widget: any;
    };
    IMAGEUPLOAD(node: LGraphNode, inputName: any, inputData: any, app: ComfyCenter): {
        widget: any;
    };
};
export type ComfyWidgetsType = typeof ComfyWidgets;
