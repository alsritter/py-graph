class AddNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "operand1": ("FLOAT", {}),
                "operand2": ("FLOAT", {})
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "add"
    DESCRIPTION = "Adds two numbers together"
    CATEGORY = "Math"

    def add(self, operand1, operand2):
        return operand1 + operand2

class SubtractNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "minuend": ("FLOAT", {}),
                "subtrahend": ("FLOAT", {})
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "subtract"
    DESCRIPTION = "Subtracts two numbers"
    CATEGORY = "Math"

    def subtract(self, minuend, subtrahend):
        return minuend - subtrahend

class MultiplyNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "factor1": ("FLOAT", {}),
                "factor2": ("FLOAT", {})
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "multiply"
    DESCRIPTION = "Multiplies two numbers"
    CATEGORY = "Math"

    def multiply(self, factor1, factor2):
        return factor1 * factor2

class DivideNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "dividend": ("FLOAT", {}),
                "divisor": ("FLOAT", {})
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "divide"
    DESCRIPTION = "Divides two numbers"
    CATEGORY = "Math"

    def divide(self, dividend, divisor):
        if divisor != 0:
            return dividend / divisor
        else:
            return float("inf")

class TextInputNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"multiline": True})
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "text"
    DESCRIPTION = "Text input"
    CATEGORY = "Input"

    def text(self, text):
        return text

class ValueInputNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "value": ("FLOAT", {})
            }
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("value",)
    DESCRIPTION = "Value input"
    FUNCTION = "value"
    CATEGORY = "Input"

    def value(self, value):
        return value


NODE_CLASS_MAPPINGS = {
  "Add": AddNode,
  "Subtract": SubtractNode,
  "Multiply": MultiplyNode,
  "Divide": DivideNode,
  "Text": TextInputNode,
  "FLOATValue": ValueInputNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "Add": "Add",
  "Subtract": "Subtract",
  "Multiply": "Multiply",
  "Divide": "Divide",
  "Text": "Text (Multiline line)",
  "FLOATValue": "FLOAT Value"
}