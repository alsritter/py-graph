import { api } from "./api.js";
import { ComfyWidgets } from "./widgets.js";
import { ComfyUI, $el } from "./ui.js";

export class ComfyApp {
	constructor() {
		this.ui = new ComfyUI(this);

		/**
		 * List of extensions that are registered with the app
		 * @type {ComfyExtension[]}
		 */
		this.extensions = [];
	}

	/**
	 * Set up the app on the page
	 */
	async setup() {
		await this.#loadExtensions();

		const mainCanvas = document.createElement("canvas")
		mainCanvas.style.touchAction = "none"
		const canvasEl = (this.canvasEl = Object.assign(mainCanvas, { id: "graph-canvas" }));
		canvasEl.tabIndex = "1";
		document.body.prepend(canvasEl);

		this.graph = new LGraph();
		const canvas = (this.canvas = new LGraphCanvas(canvasEl, this.graph));
		this.ctx = canvasEl.getContext("2d");

		LiteGraph.release_link_on_empty_shows_menu = true;
		LiteGraph.alt_drag_do_clone_nodes = true;

		this.graph.start();

		function resizeCanvas() {
			// Limit minimal scale to 1, see https://github.com/comfyanonymous/ComfyUI/pull/845
			const scale = Math.max(window.devicePixelRatio, 1);
			const { width, height } = canvasEl.getBoundingClientRect();
			canvasEl.width = Math.round(width * scale);
			canvasEl.height = Math.round(height * scale);
			canvasEl.getContext("2d").scale(scale, scale);
			canvas.draw(true, true);
		}

		// Ensure the canvas fills the window
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		await this.#invokeExtensionsAsync("init");
		await this.registerNodes();

		// Save current workflow automatically
		setInterval(() => localStorage.setItem("workflow", JSON.stringify(this.graph.serialize())), 1000);

		await this.#invokeExtensionsAsync("setup");
	}

	/**
	 * Registers nodes with the graph
	 */
	async registerNodes() {
		const app = this;
		// Load node definitions from the backend
		const defs = await api.getNodeDefs();
		await this.registerNodesFromDefs(defs);
		await this.#invokeExtensionsAsync("registerCustomNodes");
	}


	async registerNodesFromDefs(defs) {
		await this.#invokeExtensionsAsync("addCustomNodeDefs", defs);

		// Generate list of known widgets
		const widgets = Object.assign(
			{},
			ComfyWidgets,
			...(await this.#invokeExtensionsAsync("getCustomWidgets")).filter(Boolean)
		);

		// Register a node for each definition
		for (const nodeId in defs) {
			const nodeData = defs[nodeId];
			const node = Object.assign(
				function ComfyNode() {
					var inputs = nodeData["input"]["required"];
					if (nodeData["input"]["optional"] != undefined) {
						inputs = Object.assign({}, nodeData["input"]["required"], nodeData["input"]["optional"])
					}
					const config = { minWidth: 1, minHeight: 1 };
					for (const inputName in inputs) {
						const inputData = inputs[inputName];
						const type = inputData[0];

						if (inputData[1]?.forceInput) {
							this.addInput(inputName, type);
						} else {
							if (Array.isArray(type)) {
								// Enums
								Object.assign(config, widgets.COMBO(this, inputName, inputData, app) || {});
							} else if (`${type}:${inputName}` in widgets) {
								// Support custom widgets by Type:Name
								Object.assign(config, widgets[`${type}:${inputName}`](this, inputName, inputData, app) || {});
							} else if (type in widgets) {
								// Standard type widgets
								Object.assign(config, widgets[type](this, inputName, inputData, app) || {});
							} else {
								// Node connection inputs
								this.addInput(inputName, type);
							}
						}
					}

					for (const o in nodeData["output"]) {
						const output = nodeData["output"][o];
						const outputName = nodeData["output_name"][o] || output;
						const outputShape = nodeData["output_is_list"][o] ? LiteGraph.GRID_SHAPE : LiteGraph.CIRCLE_SHAPE;
						this.addOutput(outputName, output, { shape: outputShape });
					}

					const s = this.computeSize();
					s[0] = Math.max(config.minWidth, s[0] * 1.5);
					s[1] = Math.max(config.minHeight, s[1]);
					this.size = s;
					this.serialize_widgets = true;
				},
				{
					title: nodeData.display_name || nodeData.name,
					comfyClass: nodeData.name,
				}
			);

			node.prototype.comfyClass = nodeData.name;
			await this.#invokeExtensionsAsync("beforeRegisterNodeDef", node, nodeData);
			LiteGraph.registerNodeType(nodeId, node);
			node.category = nodeData.category;
		}
	}

	/**
	 * 从 API URL 加载扩展
	 */
	async #loadExtensions() {
		const extensions = await api.getExtensions();
		for (const ext of extensions) {
			try {
				await import(api.apiURL(ext));
			} catch (error) {
				console.error("Error loading extension", ext, error);
			}
		}
	}

	/**
 * Invoke an async extension callback
 * Each callback will be invoked concurrently
 * @param {string} method The extension callback to execute
 * @param  {...any} args Any arguments to pass to the callback
 * @returns
 */
	async #invokeExtensionsAsync(method, ...args) {
		// 这里传入的是一个自定义插件的不同执行阶段的函数名称，具体参考 logging.js.example 文件的说明
		return await Promise.all(
			this.extensions.map(async (ext) => {
				if (method in ext) {
					try {
						return await ext[method](...args, this);
					} catch (error) {
						console.error(
							`Error calling extension '${ext.name}' method '${method}'`,
							{ error },
							{ extension: ext },
							{ args }
						);
					}
				}
			})
		);
	}

	/**
	 * Registers extension with the app
	 * @param {ComfyExtension} extension
	 */
	registerExtension(extension) {
		if (!extension.name) {
			throw new Error("Extensions must have a 'name' property.");
		}
		if (this.extensions.find((ext) => ext.name === extension.name)) {
			throw new Error(`Extension named '${extension.name}' already registered.`);
		}
		this.extensions.push(extension);
	}

	#formatPromptError(error) {
		if (error == null) {
			return "(unknown error)"
		}
		else if (typeof error === "string") {
			return error;
		}
		else if (error.stack && error.message) {
			return error.toString()
		}
		else if (error.response) {
			let message = error.response.error.message;
			if (error.response.error.details)
				message += ": " + error.response.error.details;
			for (const [nodeID, nodeError] of Object.entries(error.response.node_errors)) {
				message += "\n" + nodeError.class_type + ":"
				for (const errorReason of nodeError.errors) {
					message += "\n    - " + errorReason.message + ": " + errorReason.details
				}
			}
			return message
		}
		return "(unknown error)"
	}

	/**
	 * 执行当前图形工作流。
	 */
	async run() {
		const p = await this.graphToPrompt();
		try {
			const res = await api.runGraph(p);
			this.lastNodeErrors = res.node_errors;
			if (this.lastNodeErrors.length > 0) {
				this.canvas.draw(true, true);
			}
		} catch (error) {
			const formattedError = this.#formatPromptError(error)
			this.ui.dialog.show(formattedError);
			if (error.response) {
				this.lastNodeErrors = error.response.node_errors;
				this.canvas.draw(true, true);
			}
		}
	}

	/**
	 * 将当前图形工作流转换为适合发送至 API 的格式。
	 * @returns {Object} 包含序列化后的工作流和节点连接的对象。
	 */
	async graphToPrompt() {
		// 序列化图形工作流
		const workflow = this.graph.serialize();
		const output = {};

		// 按执行顺序处理节点
		for (const node of this.graph.computeExecutionOrder(false)) {
			const n = workflow.nodes.find((n) => n.id === node.id);

			if (node.isVirtualNode) {
				// 不序列化仅在前端使用的节点，但允许它们进行更改
				if (node.applyToGraph) {
					node.applyToGraph(workflow);
				}
				continue;
			}

			if (node.mode === 2 || node.mode === 4) {
				// 不序列化已静音的节点
				continue;
			}

			const inputs = {};
			const widgets = node.widgets;

			// 存储所有小部件的值
			if (widgets) {
				for (const i in widgets) {
					const widget = widgets[i];
					if (!widget.options || widget.options.serialize !== false) {
						inputs[widget.name] = widget.serializeValue ? await widget.serializeValue(n, i) : widget.value;
					}
				}
			}

			// 存储所有节点连接
			for (let i in node.inputs) {
				let parent = node.getInputNode(i);
				if (parent) {
					let link = node.getInputLink(i);
					while (parent.mode === 4 || parent.isVirtualNode) {
						let found = false;
						if (parent.isVirtualNode) {
							link = parent.getInputLink(link.origin_slot);
							if (link) {
								parent = parent.getInputNode(link.target_slot);
								if (parent) {
									found = true;
								}
							}
						} else if (link && parent.mode === 4) {
							let all_inputs = [link.origin_slot];
							if (parent.inputs) {
								all_inputs = all_inputs.concat(Object.keys(parent.inputs))
								for (let parent_input in all_inputs) {
									parent_input = all_inputs[parent_input];
									if (parent.inputs[parent_input].type === node.inputs[i].type) {
										link = parent.getInputLink(parent_input);
										if (link) {
											parent = parent.getInputNode(parent_input);
										}
										found = true;
										break;
									}
								}
							}
						}

						if (!found) {
							break;
						}
					}

					if (link) {
						inputs[node.inputs[i].name] = [String(link.origin_id), parseInt(link.origin_slot)];
					}
				}
			}

			output[String(node.id)] = {
				inputs,
				class_type: node.comfyClass,
			};
		}

		// 移除与已删除节点连接的输入
		for (const o in output) {
			for (const i in output[o].inputs) {
				if (Array.isArray(output[o].inputs[i])
					&& output[o].inputs[i].length === 2
					&& !output[output[o].inputs[i][0]]) {
					delete output[o].inputs[i];
				}
			}
		}

		return { workflow, output };
	}

}

export const app = new ComfyApp();
