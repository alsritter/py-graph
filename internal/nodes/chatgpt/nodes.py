import openai  # 导入 ChatGPT 的库

openai.api_key = "ap-TkrA06qmVbXXC76x0aMapuAngWF0yYgT5YllqJljU52zSXhJ"
openai.api_base = "https://api.aiproxy.io/v1"


class ChatGPTNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
                "text": ("STRING", {"forceInput": True, }),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "execute"
    DESCRIPTION = "Generates text using ChatGPT"
    CATEGORY = "tools"

    def execute(self, seed, text: str):
        # 调用 ChatGPT 3.5-turbo 模型
        res = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": text}],
        )

        # 检查响应是否存在
        if "choices" in res and len(res["choices"]) > 0:
            generated_text = res["choices"][0]["message"]["content"].strip()
            return (generated_text,)
        else:
            # 处理响应不存在的情况，例如返回一个默认值或引发异常
            return ("No response from the model",)
