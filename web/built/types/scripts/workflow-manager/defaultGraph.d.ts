export namespace defaultGraph {
    let last_node_id: number;
    let last_link_id: number;
    let nodes: ({
        id: number;
        type: string;
        pos: number[];
        size: {
            "0": number;
            "1": number;
        };
        flags: {};
        order: number;
        mode: number;
        inputs: {
            name: string;
            type: string;
            link: number;
            widget: {
                name: string;
                config: (string | {
                    default_input: boolean;
                })[];
            };
        }[];
        properties: {};
        widgets_values: number[];
        outputs?: undefined;
    } | {
        id: number;
        type: string;
        pos: number[];
        size: {
            "0": number;
            "1": number;
        };
        flags: {};
        order: number;
        mode: number;
        outputs: {
            name: string;
            type: string;
            links: number[];
            shape: number;
            slot_index: number;
        }[];
        properties: {};
        widgets_values: number[];
        inputs?: undefined;
    })[];
    let links: (string | number)[][];
    let groups: any[];
    let config: {};
    let extra: {};
    let version: number;
}
