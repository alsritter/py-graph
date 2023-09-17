var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _NodeManager_instances, _NodeManager_addDrawBackgroundHandler;
import { ComfyWidgets } from '../widgets.js';
export class NodeManager {
    constructor(eventManager) {
        _NodeManager_instances.add(this);
        this.eventManager = eventManager;
    }
    setup(config) {
        throw new Error('Method not implemented.');
    }
    registerNodesFromDefs(defs) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventManager.invokeExtensions('addCustomNodeDefs', defs);
            const widgets = Object.assign({}, ComfyWidgets, ...(yield this.eventManager.invokeExtensions('getCustomWidgets')).filter(Boolean));
            const that = this;
            console.log('Registering nodes', defs);
            for (const nodeId in defs) {
                const nodeData = defs[nodeId];
                const node = Object.assign(function ComfyNode() {
                    var _a;
                    var inputs = nodeData['input']['required'];
                    if (nodeData['input']['optional'] != undefined) {
                        inputs = Object.assign({}, nodeData['input']['required'], nodeData['input']['optional']);
                    }
                    const config = { minWidth: 1, minHeight: 1 };
                    for (const inputName in inputs) {
                        const inputData = inputs[inputName];
                        const type = inputData[0];
                        if ((_a = inputData[1]) === null || _a === void 0 ? void 0 : _a.forceInput) {
                            this.addInput(inputName, type);
                        }
                        else {
                            if (Array.isArray(type)) {
                                Object.assign(config, widgets.COMBO(this, inputName, inputData, app) || {});
                            }
                            else if (`${type}:${inputName}` in widgets) {
                                Object.assign(config, widgets[`${type}:${inputName}`](this, inputName, inputData, app) || {});
                            }
                            else if (type in widgets) {
                                Object.assign(config, widgets[type](this, inputName, inputData, app) || {});
                            }
                            else {
                                this.addInput(inputName, type);
                            }
                        }
                    }
                    for (const o in nodeData['output']) {
                        const output = nodeData['output'][o];
                        const outputName = nodeData['output_name'][o] || output;
                        const outputShape = nodeData['output_is_list'][o]
                            ? LiteGraph.GRID_SHAPE
                            : LiteGraph.CIRCLE_SHAPE;
                        this.addOutput(outputName, output, { shape: outputShape });
                    }
                    const s = this.computeSize();
                    s[0] = Math.max(config.minWidth, s[0] * 1.5);
                    s[1] = Math.max(config.minHeight, s[1]);
                    this.size = s;
                    this.serialize_widgets = true;
                    that.eventManager.invokeExtensions('nodeCreated', this);
                }, {
                    title: nodeData.display_name || nodeData.name,
                    comfyClass: nodeData.name,
                    category: nodeData.category
                });
                node.prototype.comfyClass = nodeData.name;
                __classPrivateFieldGet(this, _NodeManager_instances, "m", _NodeManager_addDrawBackgroundHandler).call(this, node);
                yield this.eventManager.invokeExtensions('beforeRegisterNodeDef', node, nodeData);
                LiteGraph.registerNodeType(nodeId, node);
                node.category = nodeData.category;
            }
        });
    }
    getPreviewFormatParam() {
        let preview_format = this.ui.settings.getSettingValue('Comfy.PreviewFormat');
        if (preview_format)
            return `&preview=${preview_format}`;
        else
            return '';
    }
}
_NodeManager_instances = new WeakSet(), _NodeManager_addDrawBackgroundHandler = function _NodeManager_addDrawBackgroundHandler(node) {
    const app = this;
    function getImageTop(node) {
        var _a;
        let shiftY;
        if (node.imageOffset != null) {
            shiftY = node.imageOffset;
        }
        else {
            if ((_a = node.widgets) === null || _a === void 0 ? void 0 : _a.length) {
                const w = node.widgets[node.widgets.length - 1];
                shiftY = w.last_y;
                if (w.computeSize) {
                    shiftY += w.computeSize()[1] + 4;
                }
                else if (w.computedHeight) {
                    shiftY += w.computedHeight;
                }
                else {
                    shiftY += LiteGraph.NODE_WIDGET_HEIGHT + 4;
                }
            }
            else {
                shiftY = node.computeSize()[1];
            }
        }
        return shiftY;
    }
    node.prototype.setSizeForImage = function () {
        if (this.inputHeight) {
            this.setSize(this.size);
            return;
        }
        const minHeight = getImageTop(this) + 220;
        if (this.size[1] < minHeight) {
            this.setSize([this.size[0], minHeight]);
        }
    };
    node.prototype.onDrawBackground = function (ctx) {
        var _a;
        if (!this.flags.collapsed) {
            let imgURLs = [];
            let imagesChanged = false;
            const output = app.nodeOutputs[this.id + ''];
            if (output && output.images) {
                if (this.images !== output.images) {
                    this.images = output.images;
                    imagesChanged = true;
                    imgURLs = imgURLs.concat(output.images.map((params) => {
                        return api.apiURL('/view?' +
                            new URLSearchParams(params).toString() +
                            app.getPreviewFormatParam());
                    }));
                }
            }
            const preview = (_a = app.nodePreviewImages) === null || _a === void 0 ? void 0 : _a[this.id + ''];
            if (this.preview !== preview) {
                this.preview = preview;
                imagesChanged = true;
                if (preview != null) {
                    imgURLs.push(preview);
                }
            }
            if (imagesChanged) {
                this.imageIndex = null;
                if (imgURLs.length > 0) {
                    Promise.all(imgURLs.map((src) => {
                        return new Promise((r) => {
                            const img = new Image();
                            img.onload = () => r(img);
                            img.onerror = () => r(null);
                            img.src = src;
                        });
                    })).then((imgs) => {
                        var _a;
                        if ((!output || this.images === output.images) &&
                            (!preview || this.preview === preview)) {
                            this.imgs = imgs.filter(Boolean);
                            (_a = this.setSizeForImage) === null || _a === void 0 ? void 0 : _a.call(this);
                            app.graph.setDirtyCanvas(true);
                        }
                    });
                }
                else {
                    this.imgs = null;
                }
            }
            if (this.imgs && this.imgs.length) {
                const canvas = this.graph.list_of_graphcanvas[0];
                const mouse = canvas.graph_mouse;
                if (!canvas.pointer_is_down && this.pointerDown) {
                    if (mouse[0] === this.pointerDown.pos[0] &&
                        mouse[1] === this.pointerDown.pos[1]) {
                        this.imageIndex = this.pointerDown.index;
                    }
                    this.pointerDown = null;
                }
                let w = this.imgs[0].naturalWidth;
                let h = this.imgs[0].naturalHeight;
                let imageIndex = this.imageIndex;
                const numImages = this.imgs.length;
                if (numImages === 1 && !imageIndex) {
                    this.imageIndex = imageIndex = 0;
                }
                const shiftY = getImageTop(this);
                let dw = this.size[0];
                let dh = this.size[1];
                dh -= shiftY;
                if (imageIndex == null) {
                    let best = 0;
                    let cellWidth;
                    let cellHeight;
                    let cols = 0;
                    let shiftX = 0;
                    for (let c = 1; c <= numImages; c++) {
                        const rows = Math.ceil(numImages / c);
                        const cW = dw / c;
                        const cH = dh / rows;
                        const scaleX = cW / w;
                        const scaleY = cH / h;
                        const scale = Math.min(scaleX, scaleY, 1);
                        const imageW = w * scale;
                        const imageH = h * scale;
                        const area = imageW * imageH * numImages;
                        if (area > best) {
                            best = area;
                            cellWidth = imageW;
                            cellHeight = imageH;
                            cols = c;
                            shiftX = c * ((cW - imageW) / 2);
                        }
                    }
                    let anyHovered = false;
                    this.imageRects = [];
                    for (let i = 0; i < numImages; i++) {
                        const img = this.imgs[i];
                        const row = Math.floor(i / cols);
                        const col = i % cols;
                        const x = col * cellWidth + shiftX;
                        const y = row * cellHeight + shiftY;
                        if (!anyHovered) {
                            anyHovered = LiteGraph.isInsideRectangle(mouse[0], mouse[1], x + this.pos[0], y + this.pos[1], cellWidth, cellHeight);
                            if (anyHovered) {
                                this.overIndex = i;
                                let value = 110;
                                if (canvas.pointer_is_down) {
                                    if (!this.pointerDown || this.pointerDown.index !== i) {
                                        this.pointerDown = { index: i, pos: [...mouse] };
                                    }
                                    value = 125;
                                }
                                ctx.filter = `contrast(${value}%) brightness(${value}%)`;
                                canvas.canvas.style.cursor = 'pointer';
                            }
                        }
                        this.imageRects.push([x, y, cellWidth, cellHeight]);
                        ctx.drawImage(img, x, y, cellWidth, cellHeight);
                        ctx.filter = 'none';
                    }
                    if (!anyHovered) {
                        this.pointerDown = null;
                        this.overIndex = null;
                    }
                }
                else {
                    const scaleX = dw / w;
                    const scaleY = dh / h;
                    const scale = Math.min(scaleX, scaleY, 1);
                    w *= scale;
                    h *= scale;
                    let x = (dw - w) / 2;
                    let y = (dh - h) / 2 + shiftY;
                    ctx.drawImage(this.imgs[imageIndex], x, y, w, h);
                    const drawButton = (x, y, sz, text) => {
                        const hovered = LiteGraph.isInsideRectangle(mouse[0], mouse[1], x + this.pos[0], y + this.pos[1], sz, sz);
                        let fill = '#333';
                        let textFill = '#fff';
                        let isClicking = false;
                        if (hovered) {
                            canvas.canvas.style.cursor = 'pointer';
                            if (canvas.pointer_is_down) {
                                fill = '#1e90ff';
                                isClicking = true;
                            }
                            else {
                                fill = '#eee';
                                textFill = '#000';
                            }
                        }
                        else {
                            this.pointerWasDown = null;
                        }
                        ctx.fillStyle = fill;
                        ctx.beginPath();
                        ctx.roundRect(x, y, sz, sz, [4]);
                        ctx.fill();
                        ctx.fillStyle = textFill;
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(text, x + 15, y + 20);
                        return isClicking;
                    };
                    if (numImages > 1) {
                        if (drawButton(x + w - 35, y + h - 35, 30, `${this.imageIndex + 1}/${numImages}`)) {
                            let i = this.imageIndex + 1 >= numImages ? 0 : this.imageIndex + 1;
                            if (!this.pointerDown || !this.pointerDown.index === i) {
                                this.pointerDown = { index: i, pos: [...mouse] };
                            }
                        }
                        if (drawButton(x + w - 35, y + 5, 30, `x`)) {
                            if (!this.pointerDown || !this.pointerDown.index === null) {
                                this.pointerDown = { index: null, pos: [...mouse] };
                            }
                        }
                    }
                }
            }
        }
    };
};
