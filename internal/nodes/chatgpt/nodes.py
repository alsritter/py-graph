import openai  # 导入 ChatGPT 的库

openai.api_key = "ap-TkrA06qmVbXXC76x0aMapuAngWF0yYgT5YllqJljU52zSXhJ"
openai.api_base = "https://api.aiproxy.io/v1"


class ChatGPTNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "execute"
    DESCRIPTION = "Generates text using ChatGPT"
    CATEGORY = "tools"

    def execute(self, text: str):
        # 调用 ChatGPT 3.5-turbo 模型
        res = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": text}],
        )

        generated_text = res["choices"][0]["message"]["content"].strip()
        return (generated_text,)
