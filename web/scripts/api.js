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
	 * init sockets and realtime updates
	 */
	init() {
		this.#createSocket();
	}

	/**
 * Creates and connects a WebSocket for realtime updates
 * @param {boolean} isReconnect If the socket is connection is a reconnect attempt
 */
	#createSocket(isReconnect) {
		if (this.socket) {
			return;
		}

		let opened = false;
		let existingSession = window.name;
		if (existingSession) {
			existingSession = "?clientId=" + existingSession;
		}
		this.socket = new WebSocket(
			`ws${window.location.protocol === "https:" ? "s" : ""}://${this.api_host}${this.api_base}/ws${existingSession}`
		);
		this.socket.binaryType = "arraybuffer";

		this.socket.addEventListener("open", () => {
			opened = true;
			if (isReconnect) {
				this.dispatchEvent(new CustomEvent("reconnected"));
			}
		});

		this.socket.addEventListener("error", () => {
			if (this.socket) this.socket.close();
			if (!isReconnect && !opened) {
				this.#pollQueue();
			}
		});

		this.socket.addEventListener("close", () => {
			setTimeout(() => {
				this.socket = null;
				this.#createSocket(true);
			}, 300);
			if (opened) {
				this.dispatchEvent(new CustomEvent("status", { detail: null }));
				this.dispatchEvent(new CustomEvent("reconnecting"));
			}
		});

		this.socket.addEventListener("message", (event) => {
			try {
				if (event.data instanceof ArrayBuffer) {
					const view = new DataView(event.data);
					const eventType = view.getUint32(0);
					const buffer = event.data.slice(4);
					switch (eventType) {
						case 1:
							const view2 = new DataView(event.data);
							const imageType = view2.getUint32(0)
							let imageMime
							switch (imageType) {
								case 1:
								default:
									imageMime = "image/jpeg";
									break;
								case 2:
									imageMime = "image/png"
							}
							const imageBlob = new Blob([buffer.slice(4)], { type: imageMime });
							this.dispatchEvent(new CustomEvent("b_preview", { detail: imageBlob }));
							break;
						default:
							throw new Error(`Unknown binary websocket message of type ${eventType}`);
					}
				}
				else {
					const msg = JSON.parse(event.data);
					switch (msg.type) {
						case "status":
							if (msg.data.sid) {
								this.clientId = msg.data.sid;
								window.name = this.clientId;
							}
							this.dispatchEvent(new CustomEvent("status", { detail: msg.data.status }));
							break;
						case "progress":
							this.dispatchEvent(new CustomEvent("progress", { detail: msg.data }));
							break;
						case "executing":
							this.dispatchEvent(new CustomEvent("executing", { detail: msg.data.node }));
							break;
						case "executed":
							this.dispatchEvent(new CustomEvent("executed", { detail: msg.data }));
							break;
						case "execution_start":
							this.dispatchEvent(new CustomEvent("execution_start", { detail: msg.data }));
							break;
						case "execution_error":
							this.dispatchEvent(new CustomEvent("execution_error", { detail: msg.data }));
							break;
						case "execution_cached":
							this.dispatchEvent(new CustomEvent("execution_cached", { detail: msg.data }));
							break;
						default:
							if (this.#registered.has(msg.type)) {
								this.dispatchEvent(new CustomEvent(msg.type, { detail: msg.data }));
							} else {
								throw new Error(`Unknown message type ${msg.type}`);
							}
					}
				}
			} catch (error) {
				console.warn("Unhandled message:", event.data, error);
			}
		});
	}

	/**
	 * Poll status  for colab and other things that don't support websockets.
	 */
	#pollQueue() {
		setInterval(async () => {
			try {
				const resp = await this.fetchApi("/runner");
				const status = await resp.json();
				this.dispatchEvent(new CustomEvent("status", { detail: status }));
			} catch (error) {
				this.dispatchEvent(new CustomEvent("status", { detail: null }));
			}
		}, 1000);
	}

	/**
	 * Loads node object definitions for the graph
	 * @returns The node definitions
	 */
	async getNodeDefs() {
		const resp = await this.fetchApi("/object_info", { cache: "no-store" });
		return await resp.json();
	}

	/**
	 * Gets a list of extension urls
	 * @returns An array of script urls to import
	 */
	async getExtensions() {
		const resp = await this.fetchApi("/extensions", { cache: "no-store" });
		return await resp.json();
	}

	/**
	 *
	 * @param {number} number The index at which to queue the runner, passing -1 will insert the runner at the front of the queue
	 * @param {object} runner The runner data to queue
	 */
	async queueRunner(number, { output, workflow }) {
		const body = {
			client_id: this.clientId,
			runner: output,
			extra_data: { extra_pnginfo: { workflow } },
		};

		if (number === -1) {
			body.front = true;
		} else if (number != 0) {
			body.number = number;
		}

		const res = await this.fetchApi("/execute", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (res.status !== 200) {
			throw {
				response: await res.json(),
			};
		}

		return await res.json();
	}
}

export const api = new ComfyApi();
