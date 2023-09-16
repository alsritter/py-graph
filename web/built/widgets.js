var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LiteGraph } from '../types/litegraph';
import { api } from './api';
function getNumberDefaults(inputData, defaultStep) {
    let defaultVal = inputData[1]['default'];
    let { min, max, step } = inputData[1];
    if (defaultVal == undefined)
        defaultVal = 0;
    if (min == undefined)
        min = 0;
    if (max == undefined)
        max = 2048;
    if (step == undefined)
        step = defaultStep;
    return { val: defaultVal, config: { min, max, step: 10.0 * step } };
}
export function addValueControlWidget(node, targetWidget, defaultValue = 'randomize') {
    const valueControl = node.addWidget('combo', 'control_after_generate', defaultValue, function (v) { }, {
        values: ['fixed', 'increment', 'decrement', 'randomize'],
        serialize: false
    });
    valueControl.afterQueued = () => {
        var v = valueControl.value;
        if (targetWidget.type == 'combo' && v !== 'fixed') {
            let current_index = targetWidget.options.values.indexOf(targetWidget.value);
            let current_length = targetWidget.options.values.length;
            switch (v) {
                case 'increment':
                    current_index += 1;
                    break;
                case 'decrement':
                    current_index -= 1;
                    break;
                case 'randomize':
                    current_index = Math.floor(Math.random() * current_length);
                default:
                    break;
            }
            current_index = Math.max(0, current_index);
            current_index = Math.min(current_length - 1, current_index);
            if (current_index >= 0) {
                let value = targetWidget.options.values[current_index];
                targetWidget.value = value;
                targetWidget.callback(value);
            }
        }
        else {
            let min = targetWidget.options.min;
            let max = targetWidget.options.max;
            max = Math.min(1125899906842624, max);
            min = Math.max(-1125899906842624, min);
            let range = (max - min) / (targetWidget.options.step / 10);
            switch (v) {
                case 'fixed':
                    break;
                case 'increment':
                    targetWidget.value += targetWidget.options.step / 10;
                    break;
                case 'decrement':
                    targetWidget.value -= targetWidget.options.step / 10;
                    break;
                case 'randomize':
                    targetWidget.value =
                        Math.floor(Math.random() * range) *
                            (targetWidget.options.step / 10) +
                            min;
                default:
                    break;
            }
            if (targetWidget.value < min)
                targetWidget.value = min;
            if (targetWidget.value > max)
                targetWidget.value = max;
        }
    };
    return valueControl;
}
const MultilineSymbol = Symbol();
const MultilineResizeSymbol = Symbol();
function addMultilineWidget(node, name, opts, app) {
    const MIN_SIZE = 50;
    function computeSize(size) {
        var _a, _b;
        if (node.widgets[0].last_y == null)
            return;
        let y = node.widgets[0].last_y;
        let freeSpace = size[1] - y;
        let widgetHeight = 0;
        const multi = [];
        for (let i = 0; i < node.widgets.length; i++) {
            const w = node.widgets[i];
            if (w.type === 'customtext') {
                multi.push(w);
            }
            else {
                if (w.computeSize) {
                    widgetHeight += w.computeSize(null)[1] + 4;
                }
                else {
                    widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 4;
                }
            }
        }
        freeSpace -= widgetHeight;
        freeSpace /= multi.length + (((_a = node.imgs) === null || _a === void 0 ? void 0 : _a.length) || 0);
        if (freeSpace < MIN_SIZE) {
            freeSpace = MIN_SIZE;
            node.size[1] =
                y + widgetHeight + freeSpace * (multi.length + (((_b = node.imgs) === null || _b === void 0 ? void 0 : _b.length) || 0));
            node.graph.setDirtyCanvas(true);
        }
        for (const w of node.widgets) {
            w.y = y;
            if (w.type === 'customtext') {
                y += freeSpace;
                w.computedHeight = freeSpace - multi.length * 4;
            }
            else if (w.computeSize) {
                y += w.computeSize()[1] + 4;
            }
            else {
                y += LiteGraph.NODE_WIDGET_HEIGHT + 4;
            }
        }
        node.inputHeight = freeSpace;
    }
    const widget = {
        type: 'customtext',
        name,
        get value() {
            return this.inputEl.value;
        },
        set value(x) {
            this.inputEl.value = x;
        },
        draw: function (ctx, _, widgetWidth, y, widgetHeight) {
            if (!this.parent.inputHeight) {
                computeSize(node.size);
            }
            const visible = app.canvas.ds.scale > 0.5 && this.type === 'customtext';
            const margin = 10;
            const elRect = ctx.canvas.getBoundingClientRect();
            const transform = new DOMMatrix()
                .scaleSelf(elRect.width / ctx.canvas.width, elRect.height / ctx.canvas.height)
                .multiplySelf(ctx.getTransform())
                .translateSelf(margin, margin + y);
            const scale = new DOMMatrix().scaleSelf(transform.a, transform.d);
            Object.assign(this.inputEl.style, {
                transformOrigin: '0 0',
                transform: scale,
                left: `${transform.a + transform.e}px`,
                top: `${transform.d + transform.f}px`,
                width: `${widgetWidth - margin * 2}px`,
                height: `${this.parent.inputHeight - margin * 2}px`,
                position: 'absolute',
                background: !node.color ? '' : node.color,
                color: !node.color ? '' : 'white',
                zIndex: app.graph._nodes.indexOf(node)
            });
            this.inputEl.hidden = !visible;
        }
    };
    widget.inputEl = document.createElement('textarea');
    widget.inputEl.className = 'comfy-multiline-input';
    widget.inputEl.value = opts.defaultVal;
    widget.inputEl.placeholder = opts.placeholder || '';
    document.addEventListener('mousedown', function (event) {
        if (!widget.inputEl.contains(event.target)) {
            widget.inputEl.blur();
        }
    });
    widget.parent = node;
    document.body.appendChild(widget.inputEl);
    node.addCustomWidget(widget);
    app.canvas.onDrawBackground = function () {
        for (let i in app.graph._nodes) {
            const n = app.graph._nodes[i];
            for (let w in n.widgets) {
                let wid = n.widgets[w];
                if (Object.hasOwn(wid, 'inputEl')) {
                    wid.inputEl.style.left = -8000 + 'px';
                    wid.inputEl.style.position = 'absolute';
                }
            }
        }
    };
    node.onRemoved = function () {
        for (let y in this.widgets) {
            if (this.widgets[y].inputEl) {
                this.widgets[y].inputEl.remove();
            }
        }
    };
    widget.onRemove = () => {
        var _a;
        (_a = widget.inputEl) === null || _a === void 0 ? void 0 : _a.remove();
        if (!--node[MultilineSymbol]) {
            node.onResize = node[MultilineResizeSymbol];
            delete node[MultilineSymbol];
            delete node[MultilineResizeSymbol];
        }
    };
    if (node[MultilineSymbol]) {
        node[MultilineSymbol]++;
    }
    else {
        node[MultilineSymbol] = 1;
        const onResize = (node[MultilineResizeSymbol] = node.onResize);
        node.onResize = function (size) {
            computeSize(size);
            if (onResize) {
                onResize.apply(this, arguments);
            }
        };
    }
    return { minWidth: 400, minHeight: 200, widget };
}
function isSlider(display, app) {
    if (app.ui.settings.getSettingValue('Comfy.DisableSliders')) {
        return 'number';
    }
    return display === 'slider' ? 'slider' : 'number';
}
export const ComfyWidgets = {
    FLOAT(node, inputName, inputData, app) {
        let widgetType = isSlider(inputData[1]['display'], app);
        const defaultInput = !!inputData[1].default_input;
        let { val, config } = getNumberDefaults(inputData, 0.5);
        if (defaultInput) {
            config = Object.assign({}, config);
        }
        return {
            widget: node.addWidget(widgetType, inputName, val, () => { }, config)
        };
    },
    INT(node, inputName, inputData, app) {
        let widgetType = isSlider(inputData[1]['display'], app);
        const { val, config } = getNumberDefaults(inputData, 1);
        Object.assign(config, { precision: 0 });
        return {
            widget: node.addWidget(widgetType, inputName, val, function (v) {
                const s = this.options.step / 10;
                this.value = Math.round(v / s) * s;
            }, config)
        };
    },
    BOOLEAN(node, inputName, inputData) {
        let defaultVal = inputData[1]['default'];
        return {
            widget: node.addWidget('toggle', inputName, defaultVal, () => { }, {
                on: inputData[1].label_on,
                off: inputData[1].label_off
            })
        };
    },
    STRING(node, inputName, inputData, app) {
        const defaultVal = inputData[1].default || '';
        const multiline = !!inputData[1].multiline;
        let res;
        if (multiline) {
            res = addMultilineWidget(node, inputName, Object.assign({ defaultVal }, inputData[1]), app);
        }
        else {
            res = {
                widget: node.addWidget('text', inputName, defaultVal, () => { }, {})
            };
        }
        if (inputData[1].dynamicPrompts != undefined)
            res.widget.dynamicPrompts = inputData[1].dynamicPrompts;
        return res;
    },
    COMBO(node, inputName, inputData, app) {
        const type = inputData[0];
        let defaultValue = type[0];
        if (inputData[1] && inputData[1].default) {
            defaultValue = inputData[1].default;
        }
        return {
            widget: node.addWidget('combo', inputName, defaultValue, () => { }, {
                values: type
            })
        };
    },
    IMAGEUPLOAD(node, inputName, inputData, app) {
        const imageWidget = node.widgets.find((w) => w.name === 'image');
        let uploadWidget;
        function showImage(name) {
            var _a;
            const img = new Image();
            img.onload = () => {
                node.imgs = [img];
                app.graph.setDirtyCanvas(true);
            };
            let folder_separator = name.lastIndexOf('/');
            let subfolder = '';
            if (folder_separator > -1) {
                subfolder = name.substring(0, folder_separator);
                name = name.substring(folder_separator + 1);
            }
            img.src = api.apiURL(`/view?filename=${name}&type=input&subfolder=${subfolder}${app.getPreviewFormatParam()}`);
            (_a = node.setSizeForImage) === null || _a === void 0 ? void 0 : _a.call(node);
        }
        var default_value = imageWidget.value;
        Object.defineProperty(imageWidget, 'value', {
            set: function (value) {
                this._real_value = value;
            },
            get: function () {
                let value;
                if (this._real_value) {
                    value = this._real_value;
                }
                else {
                    return default_value;
                }
                if (value.filename) {
                    let real_value = value;
                    value = '';
                    if (real_value.subfolder) {
                        value = real_value.subfolder + '/';
                    }
                    value += real_value.filename;
                    if (real_value.type && real_value.type !== 'input')
                        value += ` [${real_value.type}]`;
                }
                return value;
            }
        });
        const cb = node.callback;
        imageWidget.callback = function () {
            showImage(imageWidget.value);
            if (cb) {
                return cb.apply(this, arguments);
            }
        };
        requestAnimationFrame(() => {
            if (imageWidget.value) {
                showImage(imageWidget.value);
            }
        });
        function uploadFile(file, updateNode) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const body = new FormData();
                    body.append('image', file);
                    const resp = yield api.fetchApi('/upload/image', {
                        method: 'POST',
                        body
                    });
                    if (resp.status === 200) {
                        const data = yield resp.json();
                        if (!imageWidget.options.values.includes(data.name)) {
                            imageWidget.options.values.push(data.name);
                        }
                        if (updateNode) {
                            showImage(data.name);
                            imageWidget.value = data.name;
                        }
                    }
                    else {
                        alert(resp.status + ' - ' + resp.statusText);
                    }
                }
                catch (error) {
                    alert(error);
                }
            });
        }
        const fileInput = document.createElement('input');
        Object.assign(fileInput, {
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp',
            style: 'display: none',
            onchange: () => __awaiter(this, void 0, void 0, function* () {
                if (fileInput.files.length) {
                    yield uploadFile(fileInput.files[0], true);
                }
            })
        });
        document.body.append(fileInput);
        uploadWidget = node.addWidget('button', 'choose file to upload', 'image', () => {
            fileInput.click();
        });
        uploadWidget.serialize = false;
        node.onDragOver = function (e) {
            if (e.dataTransfer && e.dataTransfer.items) {
                const image = [...e.dataTransfer.items].find((f) => f.kind === 'file');
                return !!image;
            }
            return false;
        };
        node.onDragDrop = function (e) {
            console.log('onDragDrop called');
            let handled = false;
            for (const file of e.dataTransfer.files) {
                if (file.type.startsWith('image/')) {
                    uploadFile(file, !handled);
                    handled = true;
                }
            }
            return handled;
        };
        return { widget: uploadWidget };
    }
};
