export const defaultGraph = {
	"last_node_id": 49,
	"last_link_id": 17,
	"nodes": [
		{
			"id": 48,
			"type": "FLOATValue",
			"pos": [
				589.3336013793935,
				331.88889884948696
			],
			"size": {
				"0": 315,
				"1": 58
			},
			"flags": {},
			"order": 0,
			"mode": 0,
			"outputs": [
				{
					"name": "value",
					"type": "FLOAT",
					"links": [
						17
					],
					"shape": 3,
					"slot_index": 0
				}
			],
			"properties": {},
			"widgets_values": [
				2
			]
		},
		{
			"id": 49,
			"type": "FLOATValue",
			"pos": [
				584.3336013793935,
				726.8888988494871
			],
			"size": {
				"0": 315,
				"1": 58
			},
			"flags": {},
			"order": 1,
			"mode": 0,
			"outputs": [
				{
					"name": "value",
					"type": "FLOAT",
					"links": [
						16
					],
					"shape": 3,
					"slot_index": 0
				}
			],
			"properties": {},
			"widgets_values": [
				1.5
			]
		},
		{
			"id": 43,
			"type": "Subtract",
			"pos": [
				1047.3336013793933,
				522.8888988494871
			],
			"size": {
				"0": 315,
				"1": 82
			},
			"flags": {},
			"order": 2,
			"mode": 0,
			"inputs": [
				{
					"name": "minuend",
					"type": "FLOAT",
					"link": 17,
					"widget": {
						"name": "minuend",
						"config": [
							"FLOAT",
							{
								"default_input": true
							}
						]
					}
				},
				{
					"name": "subtrahend",
					"type": "FLOAT",
					"link": 16,
					"widget": {
						"name": "subtrahend",
						"config": [
							"FLOAT",
							{
								"default_input": true
							}
						]
					}
				}
			],
			"outputs": [
				{
					"name": "FLOAT",
					"type": "FLOAT",
					"links": [
						15
					],
					"shape": 3,
					"slot_index": 0
				}
			],
			"properties": {},
			"widgets_values": [
				0,
				0
			]
		},
		{
			"id": 47,
			"type": "OutputToStdout",
			"pos": [
				1699,
				526
			],
			"size": {
				"0": 315,
				"1": 58
			},
			"flags": {},
			"order": 3,
			"mode": 0,
			"inputs": [
				{
					"name": "value",
					"type": "FLOAT",
					"link": 15,
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
		}
	],
	"links": [
		[
			15,
			43,
			0,
			47,
			0,
			"FLOAT"
		],
		[
			16,
			49,
			0,
			43,
			1,
			"FLOAT"
		],
		[
			17,
			48,
			0,
			43,
			0,
			"FLOAT"
		]
	],
	"groups": [
		{
			"title": "Group",
			"bounding": [
				492,
				184,
				1121,
				764
			],
			"color": "#3f789e"
		}
	],
	"config": {},
	"extra": {},
	"version": 0.4
}