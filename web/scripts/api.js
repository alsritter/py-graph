import { AddNode, SubtractNode, MultiplyNode, DivideNode, TextInportNode, ValueInportNode } from "./api_mock.js";

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

		// Mock data
		return {
			AddNode,
			SubtractNode,
			MultiplyNode,
			DivideNode,
			TextInportNode,
			ValueInportNode
		}
	}
}

export const api = new ComfyApi();
