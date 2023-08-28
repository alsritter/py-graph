class ComfyApi extends EventTarget {
	#registered = new Set();

	constructor() {
		super();
		this.api_host = location.host;
		this.api_base = location.pathname.split('/').slice(0, -1).join('/');
	}

	apiURL(route) {
		return this.api_base + route;
	}

	fetchApi(route, options) {
		return fetch(this.apiURL(route), options);
	}

	addEventListener(type, callback, options) {
		super.addEventListener(type, callback, options);
		this.#registered.add(type);
	}

	/**
	 * Loads node object definitions for the graph
	 * @returns The node definitions
	 */
	async getNodeDefs() {
		// const resp = await this.fetchApi("/object_info", { cache: "no-store" });
		// return await resp.json();
		// Mock
		return {
			NodeClass1: {
				input: {
					required: {
						testArgs1: ["type1", {}],
						testArgs2: ["type2", {}],
					},
					optional: {
						input3: ["type3", {}],
					},
				},
				output: ["type1", "type3"],
				output_name: ["output_name1", "output_name2"],
				output_is_list: [true, false],
				name: "NodeClass1",
				display_name: "Display Name for NodeClass1",
				category: "sd",
			},
			NodeClass2: {
				input: {
					required: {
						testArgs1: ["type1", {}],
						testArgs3: ["type3", {}],
					},
					optional: {
						input2: ["type2", {}],
					},
				},
				output: ["type1"],
				output_name: ["output_name1"],
				output_is_list: [false],
				name: "NodeClass2",
				display_name: "Display Name for NodeClass2",
				category: "sd",
			},
		};
	}
}

export const api = new ComfyApi();
