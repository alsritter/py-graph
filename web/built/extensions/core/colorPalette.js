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
import { $el } from '../../scripts/canvas-manager/tools.js';
const colorPalettes = {
    dark: {
        id: 'dark',
        name: 'Dark (Default)',
        colors: {
            node_slot: {
                CLIP: '#FFD500',
                CLIP_VISION: '#A8DADC',
                CLIP_VISION_OUTPUT: '#ad7452',
                CONDITIONING: '#FFA931',
                CONTROL_NET: '#6EE7B7',
                IMAGE: '#64B5F6',
                LATENT: '#FF9CF9',
                MASK: '#81C784',
                MODEL: '#B39DDB',
                STYLE_MODEL: '#C2FFAE',
                VAE: '#FF6E6E',
                TAESD: '#DCC274'
            },
            litegraph_base: {
                BACKGROUND_IMAGE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=',
                CLEAR_BACKGROUND_COLOR: '#222',
                NODE_TITLE_COLOR: '#999',
                NODE_SELECTED_TITLE_COLOR: '#FFF',
                NODE_TEXT_SIZE: 14,
                NODE_TEXT_COLOR: '#AAA',
                NODE_SUBTEXT_SIZE: 12,
                NODE_DEFAULT_COLOR: '#333',
                NODE_DEFAULT_BGCOLOR: '#353535',
                NODE_DEFAULT_BOXCOLOR: '#666',
                NODE_DEFAULT_SHAPE: 'box',
                NODE_BOX_OUTLINE_COLOR: '#FFF',
                DEFAULT_SHADOW_COLOR: 'rgba(0,0,0,0.5)',
                DEFAULT_GROUP_FONT: 24,
                WIDGET_BGCOLOR: '#222',
                WIDGET_OUTLINE_COLOR: '#666',
                WIDGET_TEXT_COLOR: '#DDD',
                WIDGET_SECONDARY_TEXT_COLOR: '#999',
                LINK_COLOR: '#9A9',
                EVENT_LINK_COLOR: '#A86',
                CONNECTING_LINK_COLOR: '#AFA'
            },
            comfy_base: {
                'fg-color': '#fff',
                'bg-color': '#202020',
                'comfy-menu-bg': '#353535',
                'comfy-input-bg': '#222',
                'input-text': '#ddd',
                'descrip-text': '#999',
                'drag-text': '#ccc',
                'error-text': '#ff4444',
                'border-color': '#4e4e4e',
                'tr-even-bg-color': '#222',
                'tr-odd-bg-color': '#353535'
            }
        }
    },
    light: {
        id: 'light',
        name: 'Light',
        colors: {
            node_slot: {
                CLIP: '#FFA726',
                CLIP_VISION: '#5C6BC0',
                CLIP_VISION_OUTPUT: '#8D6E63',
                CONDITIONING: '#EF5350',
                CONTROL_NET: '#66BB6A',
                IMAGE: '#42A5F5',
                LATENT: '#AB47BC',
                MASK: '#9CCC65',
                MODEL: '#7E57C2',
                STYLE_MODEL: '#D4E157',
                VAE: '#FF7043'
            },
            litegraph_base: {
                BACKGROUND_IMAGE: 'data:image/gif;base64,R0lGODlhZABkALMAAAAAAP///+vr6+rq6ujo6Ofn5+bm5uXl5d3d3f///wAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAkALAAAAABkAGQAAAT/UMhJq7046827HkcoHkYxjgZhnGG6si5LqnIM0/fL4qwwIMAg0CAsEovBIxKhRDaNy2GUOX0KfVFrssrNdpdaqTeKBX+dZ+jYvEaTf+y4W66mC8PUdrE879f9d2mBeoNLfH+IhYBbhIx2jkiHiomQlGKPl4uZe3CaeZifnnijgkESBqipqqusra6vsLGys62SlZO4t7qbuby7CLa+wqGWxL3Gv3jByMOkjc2lw8vOoNSi0czAncXW3Njdx9Pf48/Z4Kbbx+fQ5evZ4u3k1fKR6cn03vHlp7T9/v8A/8Gbp4+gwXoFryXMB2qgwoMMHyKEqA5fxX322FG8tzBcRnMW/zlulPbRncmQGidKjMjyYsOSKEF2FBlJQMCbOHP6c9iSZs+UnGYCdbnSo1CZI5F64kn0p1KnTH02nSoV3dGTV7FFHVqVq1dtWcMmVQZTbNGu72zqXMuW7danVL+6e4t1bEy6MeueBYLXrNO5Ze36jQtWsOG97wIj1vt3St/DjTEORss4nNq2mDP3e7w4r1bFkSET5hy6s2TRlD2/mSxXtSHQhCunXo26NevCpmvD/UU6tuullzULH76q92zdZG/Ltv1a+W+osI/nRmyc+fRi1Xdbh+68+0vv10dH3+77KD/i6IdnX669/frn5Zsjh4/2PXju8+8bzc9/6fj27LFnX11/+IUnXWl7BJfegm79FyB9JOl3oHgSklefgxAC+FmFGpqHIYcCfkhgfCohSKKJVo044YUMttggiBkmp6KFXw1oII24oYhjiDByaKOOHcp3Y5BD/njikSkO+eBREQAAOw==',
                CLEAR_BACKGROUND_COLOR: 'lightgray',
                NODE_TITLE_COLOR: '#222',
                NODE_SELECTED_TITLE_COLOR: '#000',
                NODE_TEXT_SIZE: 14,
                NODE_TEXT_COLOR: '#444',
                NODE_SUBTEXT_SIZE: 12,
                NODE_DEFAULT_COLOR: '#F7F7F7',
                NODE_DEFAULT_BGCOLOR: '#F5F5F5',
                NODE_DEFAULT_BOXCOLOR: '#CCC',
                NODE_DEFAULT_SHAPE: 'box',
                NODE_BOX_OUTLINE_COLOR: '#000',
                DEFAULT_SHADOW_COLOR: 'rgba(0,0,0,0.1)',
                DEFAULT_GROUP_FONT: 24,
                WIDGET_BGCOLOR: '#D4D4D4',
                WIDGET_OUTLINE_COLOR: '#999',
                WIDGET_TEXT_COLOR: '#222',
                WIDGET_SECONDARY_TEXT_COLOR: '#555',
                LINK_COLOR: '#4CAF50',
                EVENT_LINK_COLOR: '#FF9800',
                CONNECTING_LINK_COLOR: '#2196F3'
            },
            comfy_base: {
                'fg-color': '#222',
                'bg-color': '#DDD',
                'comfy-menu-bg': '#F5F5F5',
                'comfy-input-bg': '#C9C9C9',
                'input-text': '#222',
                'descrip-text': '#444',
                'drag-text': '#555',
                'error-text': '#F44336',
                'border-color': '#888',
                'tr-even-bg-color': '#f9f9f9',
                'tr-odd-bg-color': '#fff'
            }
        }
    },
    solarized: {
        id: 'solarized',
        name: 'Solarized',
        colors: {
            node_slot: {
                CLIP: '#2AB7CA',
                CLIP_VISION: '#6c71c4',
                CLIP_VISION_OUTPUT: '#859900',
                CONDITIONING: '#d33682',
                CONTROL_NET: '#d1ffd7',
                IMAGE: '#5940bb',
                LATENT: '#268bd2',
                MASK: '#CCC9E7',
                MODEL: '#dc322f',
                STYLE_MODEL: '#1a998a',
                UPSCALE_MODEL: '#054A29',
                VAE: '#facfad'
            },
            litegraph_base: {
                NODE_TITLE_COLOR: '#fdf6e3',
                NODE_SELECTED_TITLE_COLOR: '#A9D400',
                NODE_TEXT_SIZE: 14,
                NODE_TEXT_COLOR: '#657b83',
                NODE_SUBTEXT_SIZE: 12,
                NODE_DEFAULT_COLOR: '#094656',
                NODE_DEFAULT_BGCOLOR: '#073642',
                NODE_DEFAULT_BOXCOLOR: '#839496',
                NODE_DEFAULT_SHAPE: 'box',
                NODE_BOX_OUTLINE_COLOR: '#fdf6e3',
                DEFAULT_SHADOW_COLOR: 'rgba(0,0,0,0.5)',
                DEFAULT_GROUP_FONT: 24,
                WIDGET_BGCOLOR: '#002b36',
                WIDGET_OUTLINE_COLOR: '#839496',
                WIDGET_TEXT_COLOR: '#fdf6e3',
                WIDGET_SECONDARY_TEXT_COLOR: '#93a1a1',
                LINK_COLOR: '#2aa198',
                EVENT_LINK_COLOR: '#268bd2',
                CONNECTING_LINK_COLOR: '#859900'
            },
            comfy_base: {
                'fg-color': '#fdf6e3',
                'bg-color': '#002b36',
                'comfy-menu-bg': '#073642',
                'comfy-input-bg': '#002b36',
                'input-text': '#93a1a1',
                'descrip-text': '#586e75',
                'drag-text': '#839496',
                'error-text': '#dc322f',
                'border-color': '#657b83',
                'tr-even-bg-color': '#002b36',
                'tr-odd-bg-color': '#073642'
            }
        }
    }
};
const id = 'Comfy.ColorPalette';
const idCustomColorPalettes = 'Comfy.CustomColorPalettes';
const defaultColorPaletteId = 'dark';
const els = {};
app.registerExtension({
    name: id,
    addCustomNodeDefs(node_defs, app) {
        const sortObjectKeys = (unordered) => {
            return Object.keys(unordered)
                .sort()
                .reduce((obj, key) => {
                obj[key] = unordered[key];
                return obj;
            }, {});
        };
        function getSlotTypes() {
            var types = [];
            const defs = node_defs;
            for (const nodeId in defs) {
                const nodeData = defs[nodeId];
                var inputs = nodeData['input']['required'];
                if (nodeData['input']['optional'] !== undefined) {
                    inputs = Object.assign({}, nodeData['input']['required'], nodeData['input']['optional']);
                }
                for (const inputName in inputs) {
                    const inputData = inputs[inputName];
                    const type = inputData[0];
                    if (!Array.isArray(type)) {
                        types.push(type);
                    }
                }
                for (const o in nodeData['output']) {
                    const output = nodeData['output'][o];
                    types.push(output);
                }
            }
            return types;
        }
        function completeColorPalette(colorPalette) {
            var types = getSlotTypes();
            for (const type of types) {
                if (!colorPalette.colors.node_slot[type]) {
                    colorPalette.colors.node_slot[type] = '';
                }
            }
            colorPalette.colors.node_slot = sortObjectKeys(colorPalette.colors.node_slot);
            return colorPalette;
        }
        const getColorPaletteTemplate = () => __awaiter(this, void 0, void 0, function* () {
            let colorPalette = {
                id: 'my_color_palette_unique_id',
                name: 'My Color Palette',
                colors: {
                    node_slot: {},
                    litegraph_base: {},
                    comfy_base: {}
                }
            };
            const defaultColorPalette = colorPalettes[defaultColorPaletteId];
            for (const key in defaultColorPalette.colors.litegraph_base) {
                if (!colorPalette.colors.litegraph_base[key]) {
                    colorPalette.colors.litegraph_base[key] = '';
                }
            }
            for (const key in defaultColorPalette.colors.comfy_base) {
                if (!colorPalette.colors.comfy_base[key]) {
                    colorPalette.colors.comfy_base[key] = '';
                }
            }
            return completeColorPalette(colorPalette);
        });
        const getCustomColorPalettes = () => {
            return app.canvasManager.ui.settings.getSettingValue(idCustomColorPalettes, {});
        };
        const setCustomColorPalettes = (customColorPalettes) => {
            return app.canvasManager.ui.settings.setSettingValue(idCustomColorPalettes, customColorPalettes);
        };
        const addCustomColorPalette = (colorPalette) => __awaiter(this, void 0, void 0, function* () {
            if (typeof colorPalette !== 'object') {
                alert('Invalid color palette.');
                return;
            }
            if (!colorPalette.id) {
                alert('Color palette missing id.');
                return;
            }
            if (!colorPalette.name) {
                alert('Color palette missing name.');
                return;
            }
            if (!colorPalette.colors) {
                alert('Color palette missing colors.');
                return;
            }
            if (colorPalette.colors.node_slot &&
                typeof colorPalette.colors.node_slot !== 'object') {
                alert('Invalid color palette colors.node_slot.');
                return;
            }
            const customColorPalettes = getCustomColorPalettes();
            customColorPalettes[colorPalette.id] = colorPalette;
            setCustomColorPalettes(customColorPalettes);
            for (const option of els.select.childNodes) {
                if (option.value === 'custom_' + colorPalette.id) {
                    els.select.removeChild(option);
                }
            }
            els.select.append($el('option', {
                textContent: colorPalette.name + ' (custom)',
                value: 'custom_' + colorPalette.id,
                selected: true
            }));
            setColorPalette('custom_' + colorPalette.id);
            yield loadColorPalette(colorPalette);
        });
        const deleteCustomColorPalette = (colorPaletteId) => __awaiter(this, void 0, void 0, function* () {
            const customColorPalettes = getCustomColorPalettes();
            delete customColorPalettes[colorPaletteId];
            setCustomColorPalettes(customColorPalettes);
            for (const option of els.select.childNodes) {
                if (option.value === defaultColorPaletteId) {
                    option.selected = true;
                }
                if (option.value === 'custom_' + colorPaletteId) {
                    els.select.removeChild(option);
                }
            }
            setColorPalette(defaultColorPaletteId);
            yield loadColorPalette(getColorPalette());
        });
        const loadColorPalette = (colorPalette) => __awaiter(this, void 0, void 0, function* () {
            colorPalette = yield completeColorPalette(colorPalette);
            if (colorPalette.colors) {
                if (colorPalette.colors.node_slot) {
                    Object.assign(app.canvasManager.canvas.default_connection_color_byType, colorPalette.colors.node_slot);
                    Object.assign(LGraphCanvas.link_type_colors, colorPalette.colors.node_slot);
                }
                if (colorPalette.colors.litegraph_base) {
                    app.canvasManager.canvas.node_title_color =
                        colorPalette.colors.litegraph_base.NODE_TITLE_COLOR;
                    app.canvasManager.canvas.default_link_color =
                        colorPalette.colors.litegraph_base.LINK_COLOR;
                    for (const key in colorPalette.colors.litegraph_base) {
                        if (colorPalette.colors.litegraph_base.hasOwnProperty(key) &&
                            LiteGraph.hasOwnProperty(key)) {
                            LiteGraph[key] = colorPalette.colors.litegraph_base[key];
                        }
                    }
                }
                if (colorPalette.colors.comfy_base) {
                    const rootStyle = document.documentElement.style;
                    for (const key in colorPalette.colors.comfy_base) {
                        rootStyle.setProperty('--' + key, colorPalette.colors.comfy_base[key]);
                    }
                }
                app.canvasManager.canvas.draw(true, true);
            }
        });
        const getColorPalette = (colorPaletteId) => {
            if (!colorPaletteId) {
                colorPaletteId = app.canvasManager.ui.settings.getSettingValue(id, defaultColorPaletteId);
            }
            if (colorPaletteId.startsWith('custom_')) {
                colorPaletteId = colorPaletteId.substr(7);
                let customColorPalettes = getCustomColorPalettes();
                if (customColorPalettes[colorPaletteId]) {
                    return customColorPalettes[colorPaletteId];
                }
            }
            return colorPalettes[colorPaletteId];
        };
        const setColorPalette = (colorPaletteId) => {
            app.canvasManager.ui.settings.setSettingValue(id, colorPaletteId);
        };
        const fileInput = $el('input', {
            type: 'file',
            accept: '.json',
            style: { display: 'none' },
            parent: document.body,
            onchange: () => {
                const file = fileInput.files[0];
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    const reader = new FileReader();
                    reader.onload = () => __awaiter(this, void 0, void 0, function* () {
                        yield addCustomColorPalette(JSON.parse(reader.result));
                    });
                    reader.readAsText(file);
                }
            }
        });
        app.canvasManager.ui.settings.addSetting({
            id,
            name: 'Color Palette',
            type: (name, setter, value) => {
                const options = [
                    ...Object.values(colorPalettes).map((c) => $el('option', {
                        textContent: c.name,
                        value: c.id,
                        selected: c.id === value
                    })),
                    ...Object.values(getCustomColorPalettes()).map((c) => $el('option', {
                        textContent: `${c.name} (custom)`,
                        value: `custom_${c.id}`,
                        selected: `custom_${c.id}` === value
                    }))
                ];
                els.select = $el('select', {
                    style: {
                        marginBottom: '0.15rem',
                        width: '100%'
                    },
                    onchange: (e) => {
                        setter(e.target.value);
                    }
                }, options);
                return $el('tr', [
                    $el('td', [
                        $el('label', {
                            for: id.replaceAll('.', '-'),
                            textContent: 'Color palette'
                        })
                    ]),
                    $el('td', [
                        els.select,
                        $el('div', {
                            style: {
                                display: 'grid',
                                gap: '4px',
                                gridAutoFlow: 'column'
                            }
                        }, [
                            $el('input', {
                                type: 'button',
                                value: 'Export',
                                onclick: () => __awaiter(this, void 0, void 0, function* () {
                                    const colorPaletteId = app.canvasManager.ui.settings.getSettingValue(id, defaultColorPaletteId);
                                    const colorPalette = yield completeColorPalette(getColorPalette(colorPaletteId));
                                    const json = JSON.stringify(colorPalette, null, 2);
                                    const blob = new Blob([json], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = $el('a', {
                                        href: url,
                                        download: colorPaletteId + '.json',
                                        style: { display: 'none' },
                                        parent: document.body
                                    });
                                    a.click();
                                    setTimeout(function () {
                                        a.remove();
                                        window.URL.revokeObjectURL(url);
                                    }, 0);
                                })
                            }),
                            $el('input', {
                                type: 'button',
                                value: 'Import',
                                onclick: () => {
                                    fileInput.click();
                                }
                            }),
                            $el('input', {
                                type: 'button',
                                value: 'Template',
                                onclick: () => __awaiter(this, void 0, void 0, function* () {
                                    const colorPalette = yield getColorPaletteTemplate();
                                    const json = JSON.stringify(colorPalette, null, 2);
                                    const blob = new Blob([json], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = $el('a', {
                                        href: url,
                                        download: 'color_palette.json',
                                        style: { display: 'none' },
                                        parent: document.body
                                    });
                                    a.click();
                                    setTimeout(function () {
                                        a.remove();
                                        window.URL.revokeObjectURL(url);
                                    }, 0);
                                })
                            }),
                            $el('input', {
                                type: 'button',
                                value: 'Delete',
                                onclick: () => __awaiter(this, void 0, void 0, function* () {
                                    let colorPaletteId = app.canvasManager.ui.settings.getSettingValue(id, defaultColorPaletteId);
                                    if (colorPalettes[colorPaletteId]) {
                                        alert('You cannot delete a built-in color palette.');
                                        return;
                                    }
                                    if (colorPaletteId.startsWith('custom_')) {
                                        colorPaletteId = colorPaletteId.substr(7);
                                    }
                                    yield deleteCustomColorPalette(colorPaletteId);
                                })
                            })
                        ])
                    ])
                ]);
            },
            defaultValue: defaultColorPaletteId,
            onChange(value) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!value) {
                        return;
                    }
                    let palette = colorPalettes[value];
                    if (palette) {
                        yield loadColorPalette(palette);
                    }
                    else if (value.startsWith('custom_')) {
                        value = value.substr(7);
                        let customColorPalettes = getCustomColorPalettes();
                        if (customColorPalettes[value]) {
                            palette = customColorPalettes[value];
                            yield loadColorPalette(customColorPalettes[value]);
                        }
                    }
                    let { BACKGROUND_IMAGE, CLEAR_BACKGROUND_COLOR } = palette.colors.litegraph_base;
                    if (BACKGROUND_IMAGE === undefined ||
                        CLEAR_BACKGROUND_COLOR === undefined) {
                        const base = colorPalettes['dark'].colors.litegraph_base;
                        BACKGROUND_IMAGE = base.BACKGROUND_IMAGE;
                        CLEAR_BACKGROUND_COLOR = base.CLEAR_BACKGROUND_COLOR;
                    }
                    app.canvasManager.canvas.updateBackground(BACKGROUND_IMAGE, CLEAR_BACKGROUND_COLOR);
                });
            }
        });
    }
});
//# sourceMappingURL=colorPalette.js.map