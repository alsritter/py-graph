import { app } from '../../scripts/app.js';
app.registerExtension({
    name: 'Comfy.RerouteNode',
    registerCustomNodes() {
        class RerouteNode {
            constructor() {
                if (!this.properties) {
                    this.properties = {};
                }
                this.properties.showOutputText = RerouteNode.defaultVisibility;
                this.properties.horizontal = false;
                const self = this;
                self.addInput('', '*');
                self.addOutput(this.properties.showOutputText ? '*' : '', '*');
                self.onConnectionsChange = function (type, index, connected, link_info) {
                    var _a, _b;
                    this.applyOrientation();
                    if (connected && type === LiteGraph.OUTPUT) {
                        const types = new Set(this.outputs[0].links
                            .map((l) => app.canvasManager.graph.links[l].type)
                            .filter((t) => t !== '*'));
                        if (types.size > 1) {
                            const linksToDisconnect = [];
                            for (let i = 0; i < this.outputs[0].links.length - 1; i++) {
                                const linkId = this.outputs[0].links[i];
                                const link = app.canvasManager.graph.links[linkId];
                                linksToDisconnect.push(link);
                            }
                            for (const link of linksToDisconnect) {
                                const node = app.canvasManager.graph.getNodeById(link.target_id);
                                node.disconnectInput(link.target_slot);
                            }
                        }
                    }
                    let currentNode = this;
                    let updateNodes = [];
                    let inputType = null;
                    let inputNode = null;
                    while (currentNode) {
                        updateNodes.unshift(currentNode);
                        const linkId = currentNode.inputs[0].link;
                        if (linkId !== null) {
                            const link = app.canvasManager.graph.links[linkId];
                            const node = app.canvasManager.graph.getNodeById(link.origin_id);
                            const type = node.constructor.type;
                            if (type === 'Reroute') {
                                if (node === this) {
                                    currentNode.disconnectInput(link.target_slot);
                                    currentNode = null;
                                }
                                else {
                                    currentNode = node;
                                }
                            }
                            else {
                                inputNode = currentNode;
                                inputType = (_b = (_a = node.outputs[link.origin_slot]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : null;
                                break;
                            }
                        }
                        else {
                            currentNode = null;
                            break;
                        }
                    }
                    const nodes = [this];
                    let outputType = null;
                    while (nodes.length) {
                        currentNode = nodes.pop();
                        const outputs = (currentNode.outputs ? currentNode.outputs[0].links : []) || [];
                        if (outputs.length) {
                            for (const linkId of outputs) {
                                const link = app.canvasManager.graph.links[linkId];
                                if (!link)
                                    continue;
                                const node = app.canvasManager.graph.getNodeById(link.target_id);
                                const type = node.constructor.type;
                                if (type === 'Reroute') {
                                    nodes.push(node);
                                    updateNodes.push(node);
                                }
                                else {
                                    const nodeOutType = node.inputs &&
                                        node.inputs[link === null || link === void 0 ? void 0 : link.target_slot] &&
                                        node.inputs[link.target_slot].type
                                        ? node.inputs[link.target_slot].type
                                        : null;
                                    if (inputType && nodeOutType !== inputType) {
                                        node.disconnectInput(link.target_slot);
                                    }
                                    else {
                                        outputType = nodeOutType;
                                    }
                                }
                            }
                        }
                        else {
                        }
                    }
                    const displayType = inputType || outputType || '*';
                    const color = LGraphCanvas.link_type_colors[displayType];
                    for (const node of updateNodes) {
                        node.outputs[0].type = inputType || '*';
                        node.__outputType = displayType;
                        node.outputs[0].name = node.properties.showOutputText
                            ? displayType
                            : '';
                        node.size = node.computeSize();
                        node.applyOrientation();
                        for (const l of node.outputs[0].links || []) {
                            const link = app.canvasManager.graph.links[l];
                            if (link) {
                                link.color = color;
                            }
                        }
                    }
                    if (inputNode) {
                        const link = app.canvasManager.graph.links[inputNode.inputs[0].link];
                        if (link) {
                            link.color = color;
                        }
                    }
                };
                this.clone = function () {
                    const cloned = RerouteNode.prototype.clone.apply(this);
                    cloned.removeOutput(0);
                    cloned.addOutput(this.properties.showOutputText ? '*' : '', '*');
                    cloned.size = cloned.computeSize();
                    return cloned;
                };
                this.isVirtualNode = true;
            }
            getExtraMenuOptions(_, options) {
                options.unshift({
                    content: (this.properties.showOutputText ? 'Hide' : 'Show') + ' Type',
                    callback: () => {
                        this.properties.showOutputText = !this.properties.showOutputText;
                        if (this.properties.showOutputText) {
                            this.outputs[0].name = this.__outputType || this.outputs[0].type;
                        }
                        else {
                            this.outputs[0].name = '';
                        }
                        this.size = this.computeSize();
                        this.applyOrientation();
                        app.canvasManager.graph.setDirtyCanvas(true, true);
                    }
                }, {
                    content: (RerouteNode.defaultVisibility ? 'Hide' : 'Show') +
                        ' Type By Default',
                    callback: () => {
                        RerouteNode.setDefaultTextVisibility(!RerouteNode.defaultVisibility);
                    }
                }, {
                    content: 'Set ' + (this.properties.horizontal ? 'Horizontal' : 'Vertical'),
                    callback: () => {
                        this.properties.horizontal = !this.properties.horizontal;
                        this.applyOrientation();
                    }
                });
            }
            applyOrientation() {
                this.horizontal = this.properties.horizontal;
                if (this.horizontal) {
                    this.inputs[0].pos = [this.size[0] / 2, 0];
                }
                else {
                    delete this.inputs[0].pos;
                }
                app.canvasManager.graph.setDirtyCanvas(true, true);
            }
            computeSize() {
                return [
                    this.properties.showOutputText && this.outputs && this.outputs.length
                        ? Math.max(75, LiteGraph.NODE_TEXT_SIZE * this.outputs[0].name.length * 0.6 +
                            40)
                        : 75,
                    26
                ];
            }
            clone() { }
            static setDefaultTextVisibility(visible) {
                RerouteNode.defaultVisibility = visible;
                if (visible) {
                    localStorage['Comfy.RerouteNode.DefaultVisibility'] = 'true';
                }
                else {
                    delete localStorage['Comfy.RerouteNode.DefaultVisibility'];
                }
            }
        }
        RerouteNode.setDefaultTextVisibility(!!localStorage['Comfy.RerouteNode.DefaultVisibility']);
        LiteGraph.registerNodeType('Reroute', Object.assign(RerouteNode, {
            title_mode: LiteGraph.NO_TITLE,
            title: 'Reroute',
            collapsable: false
        }));
        RerouteNode.category = 'utils';
    }
});
//# sourceMappingURL=rerouteNode.js.map