from abc import ABC, abstractmethod
from internal.nodes.chatgpt.nodes import ChatGPTNode
import internal.utils
import time


class BaseNode(ABC):
    # @classmethod：将方法转换为类方法，即该方法可以通过类名直接调用，而不需要先创建类的实例。
    # 类方法的第一个参数通常被命名为 cls，用于表示类本身。
    #
    # @abstractmethod：将方法声明为抽象方法，即该方法必须在子类中被实现。
    # 抽象方法只有方法签名，没有具体的实现。
    @classmethod
    @abstractmethod
    def INPUT_TYPES(cls):
        pass

    # 这个函数会在执行 execute 之前被调用，用于检查输入是否合法
    # def VALIDATE_INPUTS(*args, **kwargs):

    FUNCTION: str = "execute"
    CATEGORY: str
    OUTPUT_NODE: bool = False
    DESCRIPTION: str
    INPUT_IS_LIST: bool = False
    RETURN_TYPES: tuple[str, ...]
    RETURN_NAMES: tuple[str, ...]
    # OUTPUT_IS_LIST: tuple[bool, ...] = [False] * len(RETURN_TYPES)
    # def execute(self, *args, **kwargs):
    #     pass


# ==================== NODES ====================


class AddNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "operand1": ("FLOAT", {"defaultInput": True, }),
                "operand2": ("FLOAT", {"defaultInput": True, }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "execute"
    DESCRIPTION = "Adds two numbers together"
    CATEGORY = "Math"

    def execute(self, operand1: float, operand2: float):
        return (operand1 + operand2,)


class SubtractNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "minuend": ("FLOAT", {"forceInput": True, }),
                "subtrahend": ("FLOAT", {"forceInput": True, }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "subtract"
    DESCRIPTION = "Subtracts two numbers"
    CATEGORY = "Math"

    def subtract(self, minuend, subtrahend):
        return (minuend - subtrahend,)


class MultiplyNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "factor1": ("FLOAT", {"forceInput": True, }),
                "factor2": ("FLOAT", {"forceInput": True, }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "execute"
    DESCRIPTION = "Multiplies two numbers"
    CATEGORY = "Math"

    def execute(self, factor1, factor2):
        return (factor1 * factor2,)


class DivideNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "dividend": ("FLOAT", {"forceInput": True, }),
                "divisor": ("FLOAT", {"forceInput": True, }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "execute"
    DESCRIPTION = "Divides two numbers"
    CATEGORY = "Math"

    def execute(self, dividend, divisor):
        if divisor != 0:
            return (dividend / divisor,)
        else:
            return (float("inf"),)


class TextInputNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"text": ("STRING", {"multiline": True})}}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "execute"
    DESCRIPTION = "Text input"
    CATEGORY = "Input"

    def execute(self, text):
        return (text,)


class ValueInputNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"value": ("FLOAT", {})}}

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("value",)
    DESCRIPTION = "Value input"
    FUNCTION = "execute"
    CATEGORY = "Input"

    def execute(self, value):
        time.sleep(3)
        return (value,)


class OutputToStdoutNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"value": ("FLOAT", {"forceInput": True, })}}

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    DESCRIPTION = "输出到控制台"
    FUNCTION = "execute"
    CATEGORY = "Output"
    OUTPUT_NODE = True

    def execute(self, value):
        pbar = internal.utils.ProgressBar(10)
        for x in range(10):
            time.sleep(1)
            pbar.update_absolute(x, 10)

        print("OutPut: ", value)
        return ()


class OutputTextToStdoutNode(BaseNode):
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"value": ("STRING", {"forceInput": True, })}}

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    DESCRIPTION = "输出到控制台"
    FUNCTION = "execute"
    CATEGORY = "Output"
    OUTPUT_NODE = True

    def execute(self, value):
        print("OutPut: ", value)
        return ()

# ==================== MAPPINGS ====================


NODE_CLASS_MAPPINGS: dict[str, BaseNode] = {
    "Add": AddNode,
    "Subtract": SubtractNode,
    "Multiply": MultiplyNode,
    "Divide": DivideNode,
    "Text": TextInputNode,
    "FLOATValue": ValueInputNode,
    "OutputToStdout": OutputToStdoutNode,
    "OutputTextToStdout": OutputTextToStdoutNode,
    "ChatGPT": ChatGPTNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Add": "Add",
    "Subtract": "Subtract",
    "Multiply": "Multiply",
    "Divide": "Divide",
    "Text": "Text (Multiline line)",
    "FLOATValue": "FLOAT Value",
    "OutputToStdout": "Output to Stdout",
    "OutputTextToStdout": "Output Text to Stdout",
    "ChatGPT": "ChatGPT",
}
