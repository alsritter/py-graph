import { app } from '../../scripts/app.js';
app.registerExtension({
    name: 'Comfy.SnapToGrid',
    init() {
        app.canvasManager.ui.settings.addSetting({
            id: 'Comfy.SnapToGrid.GridSize',
            name: 'Grid Size',
            type: 'slider',
            attrs: {
                min: 1,
                max: 500
            },
            tooltip: 'When dragging and resizing nodes while holding shift they will be aligned to the grid, this controls the size of that grid.',
            defaultValue: LiteGraph.CANVAS_GRID_SIZE,
            onChange(value) {
                LiteGraph.CANVAS_GRID_SIZE = +value;
            }
        });
        const onNodeMoved = app.canvasManager.canvas.onNodeMoved;
        app.canvasManager.canvas.onNodeMoved = function (node) {
            const r = onNodeMoved === null || onNodeMoved === void 0 ? void 0 : onNodeMoved.apply(this, arguments);
            if (app.stateHandler.shiftDown) {
                for (const id in this.selected_nodes) {
                    this.selected_nodes[id].alignToGrid();
                }
            }
            return r;
        };
        const onNodeAdded = app.canvasManager.graph.onNodeAdded;
        app.canvasManager.graph.onNodeAdded = function (node) {
            const onResize = node.onResize;
            node.onResize = function () {
                if (app.stateHandler.shiftDown) {
                    const w = LiteGraph.CANVAS_GRID_SIZE *
                        Math.round(node.size[0] / LiteGraph.CANVAS_GRID_SIZE);
                    const h = LiteGraph.CANVAS_GRID_SIZE *
                        Math.round(node.size[1] / LiteGraph.CANVAS_GRID_SIZE);
                    node.size[0] = w;
                    node.size[1] = h;
                }
                return onResize === null || onResize === void 0 ? void 0 : onResize.apply(this, arguments);
            };
            return onNodeAdded === null || onNodeAdded === void 0 ? void 0 : onNodeAdded.apply(this, arguments);
        };
        const origDrawNode = LGraphCanvas.prototype.drawNode;
        LGraphCanvas.prototype.drawNode = function (node, ctx) {
            if (app.stateHandler.shiftDown &&
                this.node_dragged &&
                node.id in this.selected_nodes) {
                const x = LiteGraph.CANVAS_GRID_SIZE *
                    Math.round(node.pos[0] / LiteGraph.CANVAS_GRID_SIZE);
                const y = LiteGraph.CANVAS_GRID_SIZE *
                    Math.round(node.pos[1] / LiteGraph.CANVAS_GRID_SIZE);
                const shiftX = x - node.pos[0];
                let shiftY = y - node.pos[1];
                let w, h;
                if (node.flags.collapsed) {
                    w = node._collapsed_width;
                    h = LiteGraph.NODE_TITLE_HEIGHT;
                    shiftY -= LiteGraph.NODE_TITLE_HEIGHT;
                }
                else {
                    w = node.size[0];
                    h = node.size[1];
                    let titleMode = node.constructor.title_mode;
                    if (titleMode !== LiteGraph.TRANSPARENT_TITLE &&
                        titleMode !== LiteGraph.NO_TITLE) {
                        h += LiteGraph.NODE_TITLE_HEIGHT;
                        shiftY -= LiteGraph.NODE_TITLE_HEIGHT;
                    }
                }
                const f = ctx.fillStyle;
                ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                ctx.fillRect(shiftX, shiftY, w, h);
                ctx.fillStyle = f;
            }
            return origDrawNode.apply(this, arguments);
        };
    }
});
//# sourceMappingURL=snapToGrid.js.map