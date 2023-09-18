var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { app } from '../../scripts/app.js';
import { ComfyWidgets } from '../../scripts/canvas-manager/widgets.js';
const extensionObj = {
    name: 'Comfy.SlotDefaults',
    suggestionsNumber: null,
    init(app) {
        LiteGraph.search_filter_enabled = true;
        LiteGraph.middle_click_slot_add_default_node = true;
        this.suggestionsNumber = app.canvasManager.ui.settings.addSetting({
            id: 'Comfy.NodeSuggestions.number',
            name: 'Number of nodes suggestions',
            type: 'slider',
            attrs: {
                min: 1,
                max: 100,
                step: 1
            },
            defaultValue: 5,
            onChange: (newVal, oldVal) => {
                this.setDefaults(newVal);
            }
        });
    },
    slot_types_default_out: {},
    slot_types_default_in: {},
    beforeRegisterNodeDef(nodeType, nodeData, app) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            var nodeId = nodeData.name;
            const inputs = (_a = nodeData.input) === null || _a === void 0 ? void 0 : _a.required;
            for (const inputKey in inputs) {
                var input = inputs[inputKey];
                if (typeof input[0] !== 'string')
                    continue;
                var type = input[0];
                if (type in ComfyWidgets) {
                    var customProperties = input[1];
                    if (!(customProperties === null || customProperties === void 0 ? void 0 : customProperties.forceInput))
                        continue;
                }
                if (!(type in this.slot_types_default_out)) {
                    this.slot_types_default_out[type] = ['Reroute'];
                }
                if (this.slot_types_default_out[type].includes(nodeId))
                    continue;
                this.slot_types_default_out[type].push(nodeId);
                const lowerType = type.toLocaleLowerCase();
                if (!(lowerType in LiteGraph.registered_slot_in_types)) {
                    LiteGraph.registered_slot_in_types[lowerType] = { nodes: [] };
                }
                LiteGraph.registered_slot_in_types[lowerType].nodes.push(nodeType.comfyClass);
            }
            var outputs = nodeData['output'];
            for (const key in outputs) {
                var type = outputs[key];
                if (!(type in this.slot_types_default_in)) {
                    this.slot_types_default_in[type] = ['Reroute'];
                }
                this.slot_types_default_in[type].push(nodeId);
                if (!(type in LiteGraph.registered_slot_out_types)) {
                    LiteGraph.registered_slot_out_types[type] = { nodes: [] };
                }
                LiteGraph.registered_slot_out_types[type].nodes.push(nodeType.comfyClass);
                if (!LiteGraph.slot_types_out.includes(type)) {
                    LiteGraph.slot_types_out.push(type);
                }
            }
            var maxNum = this.suggestionsNumber.value;
            this.setDefaults(maxNum);
        });
    },
    setDefaults(maxNum) {
        LiteGraph.slot_types_default_out = {};
        LiteGraph.slot_types_default_in = {};
        for (const type in this.slot_types_default_out) {
            LiteGraph.slot_types_default_out[type] = this.slot_types_default_out[type].slice(0, maxNum);
        }
        for (const type in this.slot_types_default_in) {
            LiteGraph.slot_types_default_in[type] = this.slot_types_default_in[type].slice(0, maxNum);
        }
    }
};
app.registerExtension(extensionObj);
//# sourceMappingURL=slotDefaults.js.map