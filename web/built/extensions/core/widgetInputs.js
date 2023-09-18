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
import { ComfyWidgets, addValueControlWidget } from '../../scripts/canvas-manager/widgets.js';
import { app } from '../../scripts/app.js';
const CONVERTED_TYPE = 'converted-widget';
const VALID_TYPES = ['STRING', 'combo', 'number', 'BOOLEAN'];
function isConvertableWidget(widget, config) {
    return VALID_TYPES.includes(widget.type) || VALID_TYPES.includes(config[0]);
}
function hideWidget(node, widget, suffix = '') {
    widget.origType = widget.type;
    widget.origComputeSize = widget.computeSize;
    widget.origSerializeValue = widget.serializeValue;
    widget.computeSize = () => [0, -4];
    widget.type = CONVERTED_TYPE + suffix;
    widget.serializeValue = () => {
        var _a;
        const { link } = (_a = node.inputs) === null || _a === void 0 ? void 0 : _a.find((i) => { var _a; return ((_a = i.widget) === null || _a === void 0 ? void 0 : _a.name) === widget.name; });
        if (link == null) {
            return undefined;
        }
        return widget.origSerializeValue
            ? widget.origSerializeValue()
            : widget.value;
    };
    if (widget.linkedWidgets) {
        for (const w of widget.linkedWidgets) {
            hideWidget(node, w, ':' + widget.name);
        }
    }
}
function showWidget(widget) {
    widget.type = widget.origType;
    widget.computeSize = widget.origComputeSize;
    widget.serializeValue = widget.origSerializeValue;
    delete widget.origType;
    delete widget.origComputeSize;
    delete widget.origSerializeValue;
    if (widget.linkedWidgets) {
        for (const w of widget.linkedWidgets) {
            showWidget(w);
        }
    }
}
function convertToInput(node, widget, config) {
    hideWidget(node, widget);
    const { linkType } = getWidgetType(config);
    const sz = node.size;
    node.addInput(widget.name, linkType, {
        widget: { name: widget.name, config }
    });
    for (const widget of node.widgets) {
        widget.last_y += LiteGraph.NODE_SLOT_HEIGHT;
    }
    node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])]);
}
function convertToWidget(node, widget) {
    showWidget(widget);
    const sz = node.size;
    node.removeInput(node.inputs.findIndex((i) => { var _a; return ((_a = i.widget) === null || _a === void 0 ? void 0 : _a.name) === widget.name; }));
    for (const widget of node.widgets) {
        widget.last_y -= LiteGraph.NODE_SLOT_HEIGHT;
    }
    node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])]);
}
function getWidgetType(config) {
    let type = config[0];
    let linkType = type;
    if (type instanceof Array) {
        type = 'COMBO';
        linkType = linkType.join(',');
    }
    return { type, linkType };
}
app.registerExtension({
    name: 'Comfy.WidgetInputs',
    beforeRegisterNodeDef(nodeType, nodeData, app) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeTypePrototype = nodeType.prototype;
            const origGetExtraMenuOptions = nodeTypePrototype.getExtraMenuOptions;
            const newGetExtraMenuOptions = function (_, options) {
                var _a, _b, _c, _d;
                const r = origGetExtraMenuOptions
                    ? origGetExtraMenuOptions.apply(this, arguments)
                    : undefined;
                if (this.widgets) {
                    const toInput = [];
                    const toWidget = [];
                    for (const w of this.widgets) {
                        if (w.type === CONVERTED_TYPE) {
                            console.log('convertToWidget', w);
                            toWidget.push({
                                content: `Convert ${w.name} to widget`,
                                callback: () => convertToWidget(this, w)
                            });
                        }
                        else {
                            const config = ((_b = (_a = nodeData === null || nodeData === void 0 ? void 0 : nodeData.input) === null || _a === void 0 ? void 0 : _a.required) === null || _b === void 0 ? void 0 : _b[w.name]) ||
                                ((_d = (_c = nodeData === null || nodeData === void 0 ? void 0 : nodeData.input) === null || _c === void 0 ? void 0 : _c.optional) === null || _d === void 0 ? void 0 : _d[w.name]) || [w.type, w.options || {}];
                            console.log('convertToInput', w);
                            if (isConvertableWidget(w, config)) {
                                toInput.push({
                                    content: `Convert ${w.name} to input`,
                                    callback: () => convertToInput(this, w, config)
                                });
                            }
                        }
                    }
                    if (toInput.length) {
                        options.push(...toInput, null);
                    }
                    if (toWidget.length) {
                        options.push(...toWidget, null);
                    }
                }
                return r;
            };
            const origOnConfigure = nodeTypePrototype.onConfigure;
            const newOnConfigure = function () {
                const r = origOnConfigure
                    ? origOnConfigure.apply(this, arguments)
                    : undefined;
                if (this.inputs) {
                    for (const input of this.inputs) {
                        if (input.widget) {
                            const w = this.widgets.find((w) => w.name === input.widget.name);
                            if (w) {
                                hideWidget(this, w);
                            }
                            else {
                                convertToWidget(this, input);
                            }
                        }
                    }
                }
                return r;
            };
            function isNodeAtPos(pos) {
                for (const n of app.canvasManager.graph._nodes) {
                    if (n.pos[0] === pos[0] && n.pos[1] === pos[1]) {
                        return true;
                    }
                }
                return false;
            }
            const ignoreDblClick = Symbol();
            const origOnInputDblClick = nodeTypePrototype.onInputDblClick;
            const newOnInputDblClick = function (slot) {
                var _a;
                const r = origOnInputDblClick
                    ? origOnInputDblClick.apply(this, arguments)
                    : undefined;
                const input = this.inputs[slot];
                if (!input.widget || !input[ignoreDblClick]) {
                    if (!(input.type in ComfyWidgets) &&
                        !(((_a = input.widget.config) === null || _a === void 0 ? void 0 : _a[0]) instanceof Array)) {
                        return r;
                    }
                }
                const node = LiteGraph.createNode('PrimitiveNode');
                app.canvasManager.graph.add(node);
                const pos = [this.pos[0] - node.size[0] - 30, this.pos[1]];
                while (isNodeAtPos(pos)) {
                    pos[1] += LiteGraph.NODE_TITLE_HEIGHT;
                }
                node.pos = pos;
                node.connect(0, this, slot);
                node.title = input.name;
                input[ignoreDblClick] = true;
                setTimeout(() => {
                    delete input[ignoreDblClick];
                }, 300);
                return r;
            };
            nodeType.prototype.onConfigure = newOnConfigure;
            nodeType.prototype.onInputDblClick = newOnInputDblClick;
            nodeType.prototype.getExtraMenuOptions = newGetExtraMenuOptions;
        });
    },
    registerCustomNodes() {
        var _PrimitiveNode_instances, _PrimitiveNode_onFirstConnection, _PrimitiveNode_createWidget, _PrimitiveNode_isValidConnection, _PrimitiveNode_onLastDisconnect;
        class PrimitiveNode extends LGraphNode {
            constructor() {
                super();
                _PrimitiveNode_instances.add(this);
                this.addOutput('connect to widget input', '*');
                this.serialize_widgets = true;
                this.isVirtualNode = true;
            }
            applyToGraph() {
                var _a, _b, _c;
                if (!((_a = this.outputs[0].links) === null || _a === void 0 ? void 0 : _a.length))
                    return;
                function get_links(node) {
                    var _a, _b;
                    let links = [];
                    if (!((_a = node.outputs[0].links) === null || _a === void 0 ? void 0 : _a.length))
                        return links;
                    for (const l of node.outputs[0].links) {
                        const linkInfo = app.canvasManager.graph.links[l];
                        const n = (_b = node === null || node === void 0 ? void 0 : node.graph) === null || _b === void 0 ? void 0 : _b.getNodeById(linkInfo.target_id);
                        if (n && n.type == 'Reroute') {
                            links = links.concat(get_links(n));
                        }
                        else {
                            links.push(l);
                        }
                    }
                    return links;
                }
                let links = get_links(this);
                for (const l of links) {
                    const linkInfo = app.canvasManager.graph.links[l];
                    const node = (_b = this.graph) === null || _b === void 0 ? void 0 : _b.getNodeById(linkInfo.target_id);
                    const input = node === null || node === void 0 ? void 0 : node.inputs[linkInfo.target_slot];
                    const widgetName = (_c = input === null || input === void 0 ? void 0 : input.widget) === null || _c === void 0 ? void 0 : _c.name;
                    if (widgetName) {
                        const widget = node === null || node === void 0 ? void 0 : node.widgets.find((w) => w.name === widgetName);
                        if (widget) {
                            widget.value = this.widgets[0].value;
                            if (widget.callback) {
                                widget.callback(widget.value, app.canvasManager.canvas, node, app.canvasManager.canvas.graph_mouse);
                            }
                        }
                    }
                }
            }
            onConnectionsChange(_, index, connected) {
                var _a, _b, _c, _d;
                if (connected) {
                    if ((_a = this.outputs[0].links) === null || _a === void 0 ? void 0 : _a.length) {
                        if (!((_b = this.widgets) === null || _b === void 0 ? void 0 : _b.length)) {
                            __classPrivateFieldGet(this, _PrimitiveNode_instances, "m", _PrimitiveNode_onFirstConnection).call(this);
                        }
                        if (!((_c = this.widgets) === null || _c === void 0 ? void 0 : _c.length) && this.outputs[0].widget) {
                            __classPrivateFieldGet(this, _PrimitiveNode_instances, "m", _PrimitiveNode_createWidget).call(this, this.outputs[0].widget.config);
                        }
                    }
                }
                else if (!((_d = this.outputs[0].links) === null || _d === void 0 ? void 0 : _d.length)) {
                    __classPrivateFieldGet(this, _PrimitiveNode_instances, "m", _PrimitiveNode_onLastDisconnect).call(this);
                }
            }
            onConnectOutput(slot, type, input, target_node, target_slot) {
                var _a;
                if (!input.widget) {
                    if (!input.type || !(input.type in ComfyWidgets))
                        return false;
                }
                if ((_a = this.outputs[slot].links) === null || _a === void 0 ? void 0 : _a.length) {
                    return __classPrivateFieldGet(this, _PrimitiveNode_instances, "m", _PrimitiveNode_isValidConnection).call(this, input);
                }
                return true;
            }
        }
        _PrimitiveNode_instances = new WeakSet(), _PrimitiveNode_onFirstConnection = function _PrimitiveNode_onFirstConnection() {
            var _a, _b, _c, _d;
            const linkId = (_c = (_b = (_a = this === null || this === void 0 ? void 0 : this.outputs) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.links) === null || _c === void 0 ? void 0 : _c[0];
            if (!linkId || !this.graph)
                return;
            const link = (_d = this.graph) === null || _d === void 0 ? void 0 : _d.links[linkId];
            if (!link)
                return;
            const theirNode = this.graph.getNodeById(link.target_id);
            if (!theirNode || !theirNode.inputs)
                return;
            const input = theirNode.inputs[link.target_slot];
            if (!input)
                return;
            var _widget;
            if (!input.widget) {
                if (!input.type || !(input.type in ComfyWidgets))
                    return;
                _widget = { name: input.name, config: [input.type, {}] };
            }
            else {
                _widget = input.widget;
            }
            const widget = _widget;
            const { type, linkType } = getWidgetType(widget.config);
            this.outputs[0].type = linkType;
            this.outputs[0].name = type;
            this.outputs[0].widget = widget;
            __classPrivateFieldGet(this, _PrimitiveNode_instances, "m", _PrimitiveNode_createWidget).call(this, widget.config, theirNode, widget.name);
        }, _PrimitiveNode_createWidget = function _PrimitiveNode_createWidget(inputData, node, widgetName) {
            let type = inputData[0];
            if (type instanceof Array) {
                type = 'COMBO';
            }
            let widget;
            if (type in ComfyWidgets) {
                widget = (ComfyWidgets[type](this, 'value', inputData, app) || {})
                    .widget;
            }
            else {
                widget = this.addWidget(type, 'value', null, () => { }, {});
            }
            if ((node === null || node === void 0 ? void 0 : node.widgets) && widget) {
                const theirWidget = node.widgets.find((w) => w.name === widgetName);
                if (theirWidget) {
                    widget.value = theirWidget.value;
                }
            }
            if (widget.type === 'number' || widget.type === 'combo') {
                addValueControlWidget(this, widget, 'fixed');
            }
            const callback = widget.callback;
            const self = this;
            widget.callback = function () {
                const r = callback ? callback.apply(this, arguments) : undefined;
                self.applyToGraph();
                return r;
            };
            const sz = this.computeSize();
            if (this.size[0] < sz[0]) {
                this.size[0] = sz[0];
            }
            if (this.size[1] < sz[1]) {
                this.size[1] = sz[1];
            }
            requestAnimationFrame(() => {
                if (this.onResize) {
                    this.onResize(this.size);
                }
            });
        }, _PrimitiveNode_isValidConnection = function _PrimitiveNode_isValidConnection(input) {
            var _a, _b, _c;
            const config1 = (_c = (_b = (_a = this.outputs) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.widget) === null || _c === void 0 ? void 0 : _c.config;
            const config2 = input.widget.config;
            if (config1[0] instanceof Array) {
                if (!(config2[0] instanceof Array))
                    return false;
                if (config1[0].length !== config2[0].length)
                    return false;
                if (config1[0].find((v, i) => config2[0][i] !== v))
                    return false;
            }
            else if (config1[0] !== config2[0]) {
                return false;
            }
            for (const k in config1[1]) {
                if (k !== 'default') {
                    if (config1[1][k] !== config2[1][k]) {
                        return false;
                    }
                }
            }
            return true;
        }, _PrimitiveNode_onLastDisconnect = function _PrimitiveNode_onLastDisconnect() {
            this.outputs[0].type = '*';
            this.outputs[0].name = 'connect to widget input';
            delete this.outputs[0].widget;
            if (this.widgets) {
                for (const w of this.widgets) {
                    if (w.onRemove) {
                        w.onRemove();
                    }
                }
                this.widgets.length = 0;
            }
        };
        LiteGraph.registerNodeType('PrimitiveNode', Object.assign(PrimitiveNode, {
            title: 'Primitive'
        }));
    }
});
//# sourceMappingURL=widgetInputs.js.map