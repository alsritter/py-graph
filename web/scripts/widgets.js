function getNumberDefaults(inputData, defaultStep) {
	let defaultVal = inputData[1]["default"];
	let { min, max, step } = inputData[1];

	if (defaultVal == undefined) defaultVal = 0;
	if (min == undefined) min = 0;
	if (max == undefined) max = 2048;
	if (step == undefined) step = defaultStep;

	return { val: defaultVal, config: { min, max, step: 10.0 * step } };
}

/**
 * 添加值控制小部件到节点上。
 * @param {Node} node - 目标节点。
 * @param {Widget} targetWidget - 目标小部件，需要受控制的小部件。
 * @param {string} [defaultValue="randomize"] - 默认值，控制模式的初始设置。可选值包括 "fixed", "increment", "decrement", "randomize"。
 * @param {Array<string>} [values] - 控制模式的可选值。默认为 ["fixed", "increment", "decrement", "randomize"]。
 * @returns {Widget} - 返回创建的值控制小部件。
 */
export function addValueControlWidget(node, targetWidget, defaultValue = "randomize", values) {
	/**
	 * 值控制小部件。
	 * @type {Widget}
	 */
	const valueControl = node.addWidget("combo", "control_after_generate", defaultValue, function (v) { }, {
		values: ["fixed", "increment", "decrement", "randomize"],
		serialize: false,
	});

	// 在排队后执行的操作
	valueControl.afterQueued = () => {
		var v = valueControl.value;
		if (targetWidget.type == "combo" && v !== "fixed") {
			let current_index = targetWidget.options.values.indexOf(targetWidget.value);
			let current_length = targetWidget.options.values.length;

			switch (v) {
				case "increment":
					current_index += 1;
					break;
				case "decrement":
					current_index -= 1;
					break;
				case "randomize":
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
		} else { //number
			let min = targetWidget.options.min;
			let max = targetWidget.options.max;
			// limit to something that javascript can handle
			max = Math.min(1125899906842624, max);
			min = Math.max(-1125899906842624, min);
			let range = (max - min) / (targetWidget.options.step / 10);

			//adjust values based on valueControl Behaviour
			switch (v) {
				case "fixed":
					break;
				case "increment":
					targetWidget.value += targetWidget.options.step / 10;
					break;
				case "decrement":
					targetWidget.value -= targetWidget.options.step / 10;
					break;
				case "randomize":
					targetWidget.value = Math.floor(Math.random() * range) * (targetWidget.options.step / 10) + min;
				default:
					break;
			}
			/*check if values are over or under their respective
			* ranges and set them to min or max.*/
			if (targetWidget.value < min)
				targetWidget.value = min;

			if (targetWidget.value > max)
				targetWidget.value = max;
		}
	}
	return valueControl;
};

const MultilineSymbol = Symbol();
const MultilineResizeSymbol = Symbol();

/**
 * 在 LiteGraph 节点上添加多行小部件，自动计算布局和尺寸。
 * @param {Object} node - 要添加小部件的 LiteGraph 节点对象。
 * @param {String} name - 小部件的名称。
 * @param {Object} opts - 小部件的选项。
 * @param {String} opts.defaultVal - 默认值
 * @param {String} opts.placeholder - 占位符
 * @param {Object} app - 应用程序的上下文。
 */
function addMultilineWidget(node, name, opts, app) {
	const MIN_SIZE = 50;

	function computeSize(size) {
		if (node.widgets[0].last_y == null) return;

		let y = node.widgets[0].last_y;
		let freeSpace = size[1] - y;

		// Compute the height of all non customtext widgets
		let widgetHeight = 0;
		const multi = [];
		for (let i = 0; i < node.widgets.length; i++) {
			const w = node.widgets[i];
			if (w.type === "customtext") {
				multi.push(w);
			} else {
				if (w.computeSize) {
					widgetHeight += w.computeSize()[1] + 4;
				} else {
					widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 4;
				}
			}
		}

		// See how large each text input can be
		freeSpace -= widgetHeight;
		freeSpace /= multi.length + (!!node.imgs?.length);

		if (freeSpace < MIN_SIZE) {
			// There isnt enough space for all the widgets, increase the size of the node
			freeSpace = MIN_SIZE;
			node.size[1] = y + widgetHeight + freeSpace * (multi.length + (!!node.imgs?.length));
			node.graph.setDirtyCanvas(true);
		}

		// Position each of the widgets
		for (const w of node.widgets) {
			w.y = y;
			if (w.type === "customtext") {
				y += freeSpace;
				w.computedHeight = freeSpace - multi.length * 4;
			} else if (w.computeSize) {
				y += w.computeSize()[1] + 4;
			} else {
				y += LiteGraph.NODE_WIDGET_HEIGHT + 4;
			}
		}

		node.inputHeight = freeSpace;
	}

	const widget = {
		type: "customtext",
		name,
		get value() {
			return this.inputEl.value;
		},
		set value(x) {
			this.inputEl.value = x;
		},
		draw: function (ctx, _, widgetWidth, y, widgetHeight) {
			if (!this.parent.inputHeight) {
				// If we are initially offscreen when created we wont have received a resize event
				// Calculate it here instead
				computeSize(node.size);
			}
			const visible = app.canvas.ds.scale > 0.5 && this.type === "customtext";
			const margin = 10;
			const elRect = ctx.canvas.getBoundingClientRect();
			const transform = new DOMMatrix()
				.scaleSelf(elRect.width / ctx.canvas.width, elRect.height / ctx.canvas.height)
				.multiplySelf(ctx.getTransform())
				.translateSelf(margin, margin + y);

			const scale = new DOMMatrix().scaleSelf(transform.a, transform.d)
			Object.assign(this.inputEl.style, {
				transformOrigin: "0 0",
				transform: scale,
				left: `${transform.a + transform.e}px`,
				top: `${transform.d + transform.f}px`,
				width: `${widgetWidth - (margin * 2)}px`,
				height: `${this.parent.inputHeight - (margin * 2)}px`,
				position: "absolute",
				background: (!node.color) ? '' : node.color,
				color: (!node.color) ? '' : 'white',
				zIndex: app.graph._nodes.indexOf(node),
			});
			this.inputEl.hidden = !visible;
		},
	};
	widget.inputEl = document.createElement("textarea");
	widget.inputEl.className = "comfy-multiline-input";
	widget.inputEl.value = opts.defaultVal;
	widget.inputEl.placeholder = opts.placeholder || "";
	document.addEventListener("mousedown", function (event) {
		if (!widget.inputEl.contains(event.target)) {
			widget.inputEl.blur();
		}
	});
	widget.parent = node;
	document.body.appendChild(widget.inputEl);

	node.addCustomWidget(widget);

	app.canvas.onDrawBackground = function () {
		// Draw node isnt fired once the node is off the screen
		// if it goes off screen quickly, the input may not be removed
		// this shifts it off screen so it can be moved back if the node is visible.
		for (let n in app.graph._nodes) {
			n = graph._nodes[n];
			for (let w in n.widgets) {
				let wid = n.widgets[w];
				if (Object.hasOwn(wid, "inputEl")) {
					wid.inputEl.style.left = -8000 + "px";
					wid.inputEl.style.position = "absolute";
				}
			}
		}
	};

	node.onRemoved = function () {
		// When removing this node we need to remove the input from the DOM
		for (let y in this.widgets) {
			if (this.widgets[y].inputEl) {
				this.widgets[y].inputEl.remove();
			}
		}
	};

	widget.onRemove = () => {
		widget.inputEl?.remove();

		// Restore original size handler if we are the last
		if (!--node[MultilineSymbol]) {
			node.onResize = node[MultilineResizeSymbol];
			delete node[MultilineSymbol];
			delete node[MultilineResizeSymbol];
		}
	};

	if (node[MultilineSymbol]) {
		node[MultilineSymbol]++;
	} else {
		node[MultilineSymbol] = 1;
		const onResize = (node[MultilineResizeSymbol] = node.onResize);

		node.onResize = function (size) {
			computeSize(size);

			// Call original resizer handler
			if (onResize) {
				onResize.apply(this, arguments);
			}
		};
	}

	return { minWidth: 400, minHeight: 200, widget };
}

function isSlider(display, app) {
	if (app.ui.settings.getSettingValue("Comfy.DisableSliders")) {
		return "number"
	}
	return (display === "slider") ? "slider" : "number"
}

/**
 * ComfyWidgets 是一个包含不同类型小部件生成函数的对象，用于在 LiteGraph 节点上添加各种类型的交互小部件。
 */
export const ComfyWidgets = {
	FLOAT(node, inputName, inputData, app) {
		let widgetType = isSlider(inputData[1]["display"], app);
		const defaultInput = !!inputData[1].default_input;
		let { val, config } = getNumberDefaults(inputData, 0.5);
		if (defaultInput) {
			config = { ...config, defaultInput: true };
		}
		return { widget: node.addWidget(widgetType, inputName, val, () => { }, config) };
	},
	INT(node, inputName, inputData, app) {
		let widgetType = isSlider(inputData[1]["display"], app);
		const { val, config } = getNumberDefaults(inputData, 1);
		Object.assign(config, { precision: 0 });
		return {
			widget: node.addWidget(
				widgetType,
				inputName,
				val,
				function (v) {
					const s = this.options.step / 10;
					this.value = Math.round(v / s) * s;
				},
				config
			),
		};
	},
	BOOLEAN(node, inputName, inputData) {
		let defaultVal = inputData[1]["default"];
		return {
			widget: node.addWidget(
				"toggle",
				inputName,
				defaultVal,
				() => { },
				{ "on": inputData[1].label_on, "off": inputData[1].label_off }
			)
		};
	},
	STRING(node, inputName, inputData, app) {
		const defaultVal = inputData[1].default || "";
		const multiline = !!inputData[1].multiline;

		let res;
		if (multiline) {
			res = addMultilineWidget(node, inputName, { defaultVal, ...inputData[1] }, app);
		} else {
			res = { widget: node.addWidget("text", inputName, defaultVal, () => { }, {}) };
		}

		if (inputData[1].dynamicPrompts != undefined)
			res.widget.dynamicPrompts = inputData[1].dynamicPrompts;

		return res;
	},
	COMBO(node, inputName, inputData) {
		const type = inputData[0];
		let defaultValue = type[0];
		if (inputData[1] && inputData[1].default) {
			defaultValue = inputData[1].default;
		}
		return { widget: node.addWidget("combo", inputName, defaultValue, () => { }, { values: type }) };
	},
};
