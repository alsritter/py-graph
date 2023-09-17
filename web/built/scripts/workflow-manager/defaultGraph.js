export const defaultGraph = {
    "last_node_id": 41,
    "last_link_id": 11,
    "nodes": [
        {
            "id": 41,
            "type": "OutputToStdout",
            "pos": [
                553,
                299
            ],
            "size": {
                "0": 315,
                "1": 58
            },
            "flags": {},
            "order": 1,
            "mode": 0,
            "inputs": [
                {
                    "name": "value",
                    "type": "FLOAT",
                    "link": 11,
                    "widget": {
                        "name": "value",
                        "config": [
                            "FLOAT",
                            {
                                "default_input": true
                            }
                        ]
                    }
                }
            ],
            "properties": {},
            "widgets_values": [
                0
            ]
        },
        {
            "id": 40,
            "type": "Add",
            "pos": [
                82,
                146
            ],
            "size": {
                "0": 315,
                "1": 82
            },
            "flags": {},
            "order": 0,
            "mode": 0,
            "outputs": [
                {
                    "name": "FLOAT",
                    "type": "FLOAT",
                    "links": [
                        11
                    ],
                    "shape": 3,
                    "slot_index": 0
                }
            ],
            "properties": {},
            "widgets_values": [
                1,
                1.5
            ]
        }
    ],
    "links": [
        [
            11,
            40,
            0,
            41,
            0,
            "FLOAT"
        ]
    ],
    "groups": [],
    "config": {},
    "extra": {},
    "version": 0.4
};
