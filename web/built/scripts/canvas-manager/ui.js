var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ComfyList_type, _ComfyList_text;
import { api } from '../api.js';
import { $el } from './tools.js';
export class ComfyUI {
    constructor(app) {
        this.lastQueueSize = 0;
        this.batchCount = 0;
        this.app = app;
        this.dialog = new ComfyDialog();
        this.settings = new ComfySettingsDialog();
        this.queue = new ComfyList('Queue', app);
        this.history = new ComfyList('History', app);
        api.addEventListener('status', () => {
            this.queue.update();
            this.history.update();
        });
        this.menuContainer = $el('div.comfy-menu', { parent: document.body }, [
            $el('div.drag-handle', {
                style: {
                    position: 'relative',
                    width: '100%',
                    cursor: 'default'
                }
            }, [
                $el('span.drag-handle'),
                $el('span', { $: (q) => (this.queueSize = q) }),
                $el('button.comfy-settings-btn', {
                    textContent: '⚙️',
                    onclick: () => this.settings.show()
                })
            ]),
            $el('button.comfy-queue-btn', {
                id: 'queue-button',
                textContent: 'Queue Runner',
                onclick: () => app.stateHandler.queueRunner(0, this.batchCount)
            }),
            $el('div', {}, [
                $el('label', { innerHTML: 'Extra options' }, [
                    $el('input', {
                        type: 'checkbox',
                        onchange: (i) => {
                            document.getElementById('extraOptions').style.display = i.target
                                .checked
                                ? 'block'
                                : 'none';
                            this.batchCount = i.target.checked
                                ? Number(document.getElementById('batchCountInputRange').value)
                                : 1;
                            const element = document.getElementById('autoQueueCheckbox');
                            element.checked = false;
                        }
                    })
                ])
            ]),
            $el('div', { id: 'extraOptions', style: { width: '100%', display: 'none' } }, [
                $el('label', { innerHTML: 'Batch count' }, [
                    $el('input', {
                        id: 'batchCountInputNumber',
                        type: 'number',
                        value: this.batchCount,
                        min: '1',
                        style: { width: '35%', 'margin-left': '0.4em' },
                        oninput: (i) => {
                            this.batchCount = i.target.value(document.getElementById('batchCountInputRange')).value = this.batchCount;
                        }
                    }),
                    $el('input', {
                        id: 'batchCountInputRange',
                        type: 'range',
                        min: '1',
                        max: '100',
                        value: this.batchCount,
                        oninput: (i) => {
                            this.batchCount = i.target.value;
                            const element = document.getElementById('batchCountInputNumber');
                            element.value = i.target.value;
                        }
                    }),
                    $el('input', {
                        id: 'autoQueueCheckbox',
                        type: 'checkbox',
                        checked: false,
                        title: 'automatically queue runner when the queue size hits 0'
                    })
                ])
            ])
        ]);
        this.settings.addSetting({
            id: 'Comfy.MenuPosition',
            name: 'Save menu position',
            type: 'boolean',
            defaultValue: true
        });
        this.dragElement(this.menuContainer, this.settings);
        this.setStatus({ exec_info: { queue_remaining: 'X' } });
    }
    setStatus(status) {
        this.queueSize.textContent =
            'Queue size: ' + (status ? status.exec_info.queue_remaining : 'ERR');
        if (status) {
            if (this.lastQueueSize != 0 &&
                status.exec_info.queue_remaining == 0 &&
                document.getElementById('autoQueueCheckbox')
                    .checked) {
                this.app.stateHandler.queueRunner(0, this.batchCount);
            }
            this.lastQueueSize = status.exec_info.queue_remaining;
        }
    }
    dragElement(dragEl, settings) {
        var posDiffX = 0, posDiffY = 0, posStartX = 0, posStartY = 0, newPosX = 0, newPosY = 0;
        if (dragEl.getElementsByClassName('drag-handle')[0]) {
            ;
            dragEl.getElementsByClassName('drag-handle')[0].onmousedown = dragMouseDown;
        }
        else {
            dragEl.onmousedown = dragMouseDown;
        }
        const resizeObserver = new ResizeObserver(() => {
            ensureInBounds();
        }).observe(dragEl);
        function ensureInBounds() {
            if (dragEl.classList.contains('comfy-menu-manual-pos')) {
                newPosX = Math.min(document.body.clientWidth - dragEl.clientWidth, Math.max(0, dragEl.offsetLeft));
                newPosY = Math.min(document.body.clientHeight - dragEl.clientHeight, Math.max(0, dragEl.offsetTop));
                positionElement();
            }
        }
        function positionElement() {
            const halfWidth = document.body.clientWidth / 2;
            const anchorRight = newPosX + dragEl.clientWidth / 2 > halfWidth;
            if (anchorRight) {
                dragEl.style.left = 'unset';
                dragEl.style.right =
                    document.body.clientWidth - newPosX - dragEl.clientWidth + 'px';
            }
            else {
                dragEl.style.left = newPosX + 'px';
                dragEl.style.right = 'unset';
            }
            dragEl.style.top = newPosY + 'px';
            dragEl.style.bottom = 'unset';
            if (savePos) {
                localStorage.setItem('Comfy.MenuPosition', JSON.stringify({
                    x: dragEl.offsetLeft,
                    y: dragEl.offsetTop
                }));
            }
        }
        function restorePos() {
            const posStr = localStorage.getItem('Comfy.MenuPosition');
            if (posStr) {
                const pos = JSON.parse(posStr);
                newPosX = pos.x;
                newPosY = pos.y;
                positionElement();
                ensureInBounds();
            }
        }
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            posStartX = e.clientX;
            posStartY = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            dragEl.classList.add('comfy-menu-manual-pos');
            posDiffX = e.clientX - posStartX;
            posDiffY = e.clientY - posStartY;
            posStartX = e.clientX;
            posStartY = e.clientY;
            newPosX = Math.min(document.body.clientWidth - dragEl.clientWidth, Math.max(0, dragEl.offsetLeft + posDiffX));
            newPosY = Math.min(document.body.clientHeight - dragEl.clientHeight, Math.max(0, dragEl.offsetTop + posDiffY));
            positionElement();
        }
        window.addEventListener('resize', () => {
            ensureInBounds();
        });
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
        let savePos = undefined;
        settings.addSetting({
            id: 'Comfy.MenuPosition',
            name: 'Save menu position',
            type: 'boolean',
            defaultValue: savePos,
            onChange(value, oldVal) {
                if (savePos === undefined && value) {
                    restorePos();
                }
                savePos = value;
            }
        });
    }
}
export class ComfyList {
    constructor(text, app, type) {
        _ComfyList_type.set(this, void 0);
        _ComfyList_text.set(this, void 0);
        __classPrivateFieldSet(this, _ComfyList_text, text, "f");
        __classPrivateFieldSet(this, _ComfyList_type, type || text.toLowerCase(), "f");
        this.element = $el('div.comfy-list');
        this.element.style.display = 'none';
        this.app = app;
    }
    get visible() {
        return this.element.style.display !== 'none';
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield api.getItems(__classPrivateFieldGet(this, _ComfyList_type, "f"));
            this.element.replaceChildren(...Object.keys(items).flatMap((section) => [
                $el('h4', {
                    textContent: section
                }),
                $el('div.comfy-list-items', [
                    ...items[section].map((item) => {
                        const removeAction = item.remove || {
                            name: 'Delete',
                            cb: () => api.deleteItem(__classPrivateFieldGet(this, _ComfyList_type, "f"), item.prompt[1])
                        };
                        return $el('div', { textContent: item.prompt[0] + ': ' }, [
                            $el('button', {
                                textContent: 'Load',
                                onclick: () => {
                                    this.app.workflowManager.loadGraphData(item.prompt[3].extra_pnginfo.workflow);
                                    if (item.outputs) {
                                        this.app.stateHandler.nodeOutputs = item.outputs;
                                    }
                                }
                            }),
                            $el('button', {
                                textContent: removeAction.name,
                                onclick: () => __awaiter(this, void 0, void 0, function* () {
                                    yield removeAction.cb();
                                    yield this.update();
                                })
                            })
                        ]);
                    })
                ])
            ]), $el('div.comfy-list-actions', [
                $el('button', {
                    textContent: 'Clear ' + __classPrivateFieldGet(this, _ComfyList_text, "f"),
                    onclick: () => __awaiter(this, void 0, void 0, function* () {
                        yield api.clearItems(__classPrivateFieldGet(this, _ComfyList_type, "f"));
                        yield this.load();
                    })
                }),
                $el('button', { textContent: 'Refresh', onclick: () => this.load() })
            ]));
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.visible) {
                yield this.load();
            }
        });
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            this.element.style.display = 'block';
            this.button.textContent = 'Close';
            yield this.load();
        });
    }
    hide() {
        this.element.style.display = 'none';
        this.button.textContent = 'View ' + __classPrivateFieldGet(this, _ComfyList_text, "f");
    }
    toggle() {
        if (this.visible) {
            this.hide();
            return false;
        }
        else {
            this.show();
            return true;
        }
    }
}
_ComfyList_type = new WeakMap(), _ComfyList_text = new WeakMap();
export class ComfyDialog {
    constructor() {
        this.element = null;
        this.textElement = null;
        this.element = $el('div.comfy-modal', { parent: document.body }, [
            $el('div.comfy-modal-content', [
                $el('p', { $: (p) => (this.textElement = p) }),
                ...this.createButtons()
            ])
        ]);
    }
    createButtons() {
        return [
            $el('button', {
                type: 'button',
                textContent: 'Close',
                onclick: () => this.close()
            })
        ];
    }
    close() {
        this.element.style.display = 'none';
    }
    show(html) {
        if (typeof html === 'string') {
            this.textElement.innerHTML = html;
        }
        else {
            this.textElement.replaceChildren(html);
        }
        this.element.style.display = 'flex';
    }
}
export class ComfySettingsDialog extends ComfyDialog {
    constructor() {
        super();
        this.settings = [];
        this.element = $el('dialog', {
            id: 'comfy-settings-dialog',
            parent: document.body
        }, [
            $el('table.comfy-modal-content.comfy-table', [
                $el('caption', { textContent: 'Settings' }),
                $el('tbody', { $: (tbody) => (this.textElement = tbody) }),
                $el('button', {
                    type: 'button',
                    textContent: 'Close',
                    style: {
                        cursor: 'pointer'
                    },
                    onclick: () => {
                        this.element.close();
                    }
                })
            ])
        ]);
        this.settings = [];
    }
    getSettingValue(id, defaultValue) {
        const settingId = 'Comfy.Settings.' + id;
        const v = localStorage[settingId];
        return v == null ? defaultValue : JSON.parse(v);
    }
    setSettingValue(id, value) {
        const settingId = 'Comfy.Settings.' + id;
        localStorage[settingId] = JSON.stringify(value);
    }
    addSetting({ id, name, type, defaultValue, onChange = (newValue, oldValue) => { }, attrs = {}, tooltip = '', options = undefined }) {
        if (!id) {
            throw new Error('Settings must have an ID');
        }
        if (this.settings.find((s) => s.id === id)) {
            throw new Error(`Setting ${id} of type ${type} must have a unique ID.`);
        }
        const settingId = `Comfy.Settings.${id}`;
        const v = localStorage[settingId];
        let value = v == null ? defaultValue : JSON.parse(v);
        if (onChange) {
            onChange(value, undefined);
        }
        this.settings.push({
            render: () => {
                const setter = (v) => {
                    if (onChange) {
                        onChange(v, value);
                    }
                    localStorage[settingId] = JSON.stringify(v);
                    value = v;
                };
                value = this.getSettingValue(id, defaultValue);
                let element;
                const htmlID = id.replaceAll('.', '-');
                const list = new DOMTokenList();
                list.add(tooltip !== '' ? 'comfy-tooltip-indicator' : '');
                const labelCell = $el('td', [
                    $el('label', {
                        for: htmlID,
                        classList: list,
                        textContent: name
                    })
                ]);
                if (typeof type === 'function') {
                    element = type(name, setter, value, attrs);
                }
                else {
                    switch (type) {
                        case 'boolean':
                            element = $el('tr', [
                                labelCell,
                                $el('td', [
                                    $el('input', {
                                        id: htmlID,
                                        type: 'checkbox',
                                        checked: value,
                                        onchange: (event) => {
                                            const isChecked = event.target.checked;
                                            if (onChange !== undefined) {
                                                onChange(isChecked);
                                            }
                                            this.setSettingValue(id, isChecked);
                                        }
                                    })
                                ])
                            ]);
                            break;
                        case 'number':
                            element = $el('tr', [
                                labelCell,
                                $el('td', [
                                    $el('input', Object.assign({ type,
                                        value, id: htmlID, oninput: (e) => {
                                            setter(e.target.value);
                                        } }, attrs))
                                ])
                            ]);
                            break;
                        case 'slider':
                            element = $el('tr', [
                                labelCell,
                                $el('td', [
                                    $el('div', {
                                        style: {
                                            display: 'grid',
                                            gridAutoFlow: 'column'
                                        }
                                    }, [
                                        $el('input', Object.assign(Object.assign({}, attrs), { value, type: 'range', oninput: (e) => {
                                                setter(e.target.value);
                                                e.target.nextElementSibling.value = e.target.value;
                                            } })),
                                        $el('input', Object.assign(Object.assign({}, attrs), { value, id: htmlID, type: 'number', style: { maxWidth: '4rem' }, oninput: (e) => {
                                                setter(e.target.value);
                                                e.target.nextElementSibling.value = e.target.value;
                                            } }))
                                    ])
                                ])
                            ]);
                            break;
                        case 'combo':
                            element = $el('tr', [
                                labelCell,
                                $el('td', [
                                    $el('select', {
                                        oninput: (e) => {
                                            setter(e.target.value);
                                        }
                                    }, (typeof options === 'function'
                                        ? options(value)
                                        : options || []).map((opt) => {
                                        var _a;
                                        if (typeof opt === 'string') {
                                            opt = { text: opt };
                                        }
                                        const v = (_a = opt.value) !== null && _a !== void 0 ? _a : opt.text;
                                        return $el('option', {
                                            value: v,
                                            textContent: opt.text,
                                            selected: value + '' === v + ''
                                        });
                                    }))
                                ])
                            ]);
                            break;
                        case 'text':
                        default:
                            if (type !== 'text') {
                                console.warn(`Unsupported setting type '${type}, defaulting to text`);
                            }
                            element = $el('tr', [
                                labelCell,
                                $el('td', [
                                    $el('input', Object.assign({ value, id: htmlID, oninput: (e) => {
                                            setter(e.target.value);
                                        } }, attrs))
                                ])
                            ]);
                            break;
                    }
                }
                if (tooltip) {
                    element.title = tooltip;
                }
                return element;
            }
        });
        const self = this;
        return {
            get value() {
                return self.getSettingValue(id, defaultValue);
            },
            set value(v) {
                self.setSettingValue(id, v);
            }
        };
    }
    show() {
        this.textElement.replaceChildren($el('tr', {
            style: { display: 'none' }
        }, [$el('th'), $el('th', { style: { width: '33%' } })]), ...this.settings.map((s) => s.render()));
        this.element.showModal();
    }
}
