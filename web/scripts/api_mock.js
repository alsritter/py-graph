// 基础加法节点
export const AddNode = {
	name: "AddNode",
	display_name: "Addition",
	category: "Math",
	input: {
		required: {
			operand1: ["FLOAT", {}],
			operand2: ["FLOAT", {}],
		},
	},
	output: ["FLOAT"],
	output_name: ["Sum"], // 输出的名称，与 output 数量对应
	output_is_list: [false], // 是否为列表
	color: "#ff9800",
	function: () => { },
};

// 基础减法节点
export const SubtractNode = {
	name: "SubtractNode",
	display_name: "Subtraction",
	category: "Math",
	input: {
		required: {
			minuend: ["FLOAT", {}],
			subtrahend: ["FLOAT", {}],
		},
	},
	output: ["FLOAT"],
	output_name: ["Difference"],
	output_is_list: [false],
};

// 基础乘法节点
export const MultiplyNode = {
	name: "MultiplyNode",
	display_name: "Multiplication",
	category: "Math",
	input: {
		required: {
			factor1: ["FLOAT", {}],
			factor2: ["FLOAT", {}],
		},
	},
	output: ["FLOAT"],
	output_name: ["Product"],
	output_is_list: [false],
};

// 基础除法节点
export const DivideNode = {
	name: "DivideNode",
	display_name: "Division",
	category: "Math",
	input: {
		required: {
			dividend: ["FLOAT", {}],
			divisor: ["FLOAT", {}],
		},
	},
	output: ["FLOAT"],
	output_name: ["Quotient"],
	output_is_list: [false],
};

export const TextInportNode = {
	name: "TextInportNode",
	display_name: "Text Inport",
	category: "Inport",
	input: {
		required: {
			text: ["STRING", {
				"multiline": true,
			}],
		},
	},
	output: ["STRING"],
	output_name: ["Text"],
	output_is_list: [false],
};

export const ValueInportNode = {
	name: "ValueInportNode",
	display_name: "Value Inport",
	category: "Inport",
	input: {
		required: {
			value: ["FLOAT", {}],
		},
	},
	output: ["FLOAT"],
	output_name: ["Value"],
	output_is_list: [false],
};
