from abc import ABC, abstractmethod
import internal.utils
import time
import os
import sys
import importlib
import traceback
import folder_paths


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
                "operand1": ("FLOAT", {"forceInput": True, }),
                "operand2": ("FLOAT", {"forceInput": True, }),
            }
        }

    RETURN_TYPES = ("FLOAT",)
    FUNCTION = "execute"
    DESCRIPTION = "Adds two numbers together"
    CATEGORY = "base/Math"

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
    CATEGORY = "base/Math"

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
    CATEGORY = "base/Math"

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
    CATEGORY = "base/Math"

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
    CATEGORY = "base"

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
    CATEGORY = "base"

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
    CATEGORY = "base"
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
    CATEGORY = "base"
    OUTPUT_NODE = True

    def execute(self, value):
        print("OutPut: ", value)
        return ()

# ==================== MAPPINGS ====================

# Node 类名映射
NODE_CLASS_MAPPINGS: dict[str, BaseNode] = {
    "Add": AddNode,
    "Subtract": SubtractNode,
    "Multiply": MultiplyNode,
    "Divide": DivideNode,
    "Text": TextInputNode,
    "FLOATValue": ValueInputNode,
    "OutputToStdout": OutputToStdoutNode,
    "OutputTextToStdout": OutputTextToStdoutNode,
}

# Node 显示名称
NODE_DISPLAY_NAME_MAPPINGS = {
    "Add": "Add",
    "Subtract": "Subtract",
    "Multiply": "Multiply",
    "Divide": "Divide",
    "Text": "Text (Multiline line)",
    "FLOATValue": "FLOAT Value",
    "OutputToStdout": "Output to Stdout",
    "OutputTextToStdout": "Output Text to Stdout",
}

EXTENSION_WEB_DIRS = {}


# ==================== LOAD CUSTOM NODES ====================
def init_custom_nodes():
    # load_custom_node(os.path.join(os.path.join(os.path.dirname(os.path.realpath(__file__)), "custom_nodes/chatgpt"), "nodes.py"))
    load_custom_node()


def load_custom_node(module_path, ignore=set()):
    module_name = os.path.basename(module_path)
    if os.path.isfile(module_path):
        sp = os.path.splitext(module_path)
        module_name = sp[0]
    try:
        if os.path.isfile(module_path):
            module_spec = importlib.util.spec_from_file_location(
                module_name, module_path)
            module_dir = os.path.split(module_path)[0]
        else:
            module_spec = importlib.util.spec_from_file_location(
                module_name, os.path.join(module_path, "__init__.py"))
            module_dir = module_path

        module = importlib.util.module_from_spec(module_spec)
        sys.modules[module_name] = module
        module_spec.loader.exec_module(module)

        if hasattr(module, "WEB_DIRECTORY") and getattr(module, "WEB_DIRECTORY") is not None:
            web_dir = os.path.abspath(os.path.join(
                module_dir, getattr(module, "WEB_DIRECTORY")))
            if os.path.isdir(web_dir):
                EXTENSION_WEB_DIRS[module_name] = web_dir

        if hasattr(module, "NODE_CLASS_MAPPINGS") and getattr(module, "NODE_CLASS_MAPPINGS") is not None:
            for name in module.NODE_CLASS_MAPPINGS:
                if name not in ignore:
                    NODE_CLASS_MAPPINGS[name] = module.NODE_CLASS_MAPPINGS[name]
            if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS") and getattr(module, "NODE_DISPLAY_NAME_MAPPINGS") is not None:
                NODE_DISPLAY_NAME_MAPPINGS.update(
                    module.NODE_DISPLAY_NAME_MAPPINGS)
            return True
        else:
            print(
                f"Skip {module_path} module for custom nodes due to the lack of NODE_CLASS_MAPPINGS.")
            return False
    except Exception as e:
        print(traceback.format_exc())
        print(f"Cannot import {module_path} module for custom nodes:", e)
        return False

def load_custom_nodes():
    base_node_names = set(NODE_CLASS_MAPPINGS.keys())
    node_paths = folder_paths.get_folder_paths("custom_nodes")
    node_import_times = []
    for custom_node_path in node_paths:
        possible_modules = os.listdir(custom_node_path)
        if "__pycache__" in possible_modules:
            possible_modules.remove("__pycache__")

        for possible_module in possible_modules:
            module_path = os.path.join(custom_node_path, possible_module)
            if os.path.isfile(module_path) and os.path.splitext(module_path)[1] != ".py": continue
            if module_path.endswith(".disabled"): continue
            time_before = time.perf_counter()
            success = load_custom_node(module_path, base_node_names)
            node_import_times.append((time.perf_counter() - time_before, module_path, success))

    if len(node_import_times) > 0:
        print("\nImport times for custom nodes:")
        for n in sorted(node_import_times):
            if n[2]:
                import_message = ""
            else:
                import_message = " (IMPORT FAILED)"
            print("{:6.1f} seconds{}:".format(n[0], import_message), n[1])
        print()