import { app } from '../../scripts/app.js';
import { ComfyWidgets } from '../../scripts/canvas-manager/widgets.js';
app.registerExtension({
    name: 'Comfy.NoteNode',
    registerCustomNodes() {
        class NoteNode {
            constructor() {
                this.color = LGraphCanvas.node_colors.yellow.color;
                this.bgcolor = LGraphCanvas.node_colors.yellow.bgcolor;
                this.groupcolor = LGraphCanvas.node_colors.yellow.groupcolor;
                if (!this.properties) {
                    this.properties = {};
                    this.properties.text = '';
                }
                ComfyWidgets.STRING(this, '', ['', { default: this.properties.text, multiline: true }], app);
                this.serialize_widgets = true;
                this.isVirtualNode = true;
            }
        }
        LiteGraph.registerNodeType('Note', Object.assign(NoteNode, {
            title_mode: LiteGraph.NORMAL_TITLE,
            title: 'Note',
            collapsable: true
        }));
        NoteNode.category = 'utils';
    }
});
//# sourceMappingURL=noteNode.js.map