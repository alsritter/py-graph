import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class EmailNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "smtp_server": ("STRING", {}),
                "smtp_port": ("INT", {"default": 587}),
                "sender_email": ("STRING", {}),
                "receiver_email": ("STRING", {}),
                "subject": ("STRING", {}),
                "message_body": ("STRING", {"forceInput": True, }),
                "smtp_username": ("STRING", {}),
                "smtp_password": ("STRING", {}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "execute"
    DESCRIPTION = "Send an email"
    CATEGORY = "tools/email"

    def execute(self, smtp_server, smtp_port, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password):
        try:
            # 创建SMTP客户端
            smtp_client = smtplib.SMTP(smtp_server, smtp_port)
            smtp_client.starttls()  # 开启TLS加密
            smtp_client.login(smtp_username, smtp_password)  # 登录SMTP服务器

            # 创建邮件对象
            message = MIMEMultipart()
            message["From"] = sender_email
            message["To"] = receiver_email
            message["Subject"] = subject

            # 添加邮件正文
            message.attach(MIMEText(message_body, "plain"))

            # 发送邮件
            smtp_client.sendmail(
                sender_email, receiver_email, message.as_string())

            # 关闭SMTP客户端
            smtp_client.quit()

            return ("Email sent successfully",)
        except Exception as e:
            return (f"Error sending email: {str(e)}",)


class QQEmailNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "sender_email": ("STRING", {}),
                "receiver_email": ("STRING", {}),
                "subject": ("STRING", {}),
                "message_body": ("STRING", {"forceInput": True, }),
                "smtp_username": ("STRING", {}),
                "smtp_password": ("STRING", {}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "execute"
    DESCRIPTION = "Send an QQ email"
    CATEGORY = "tools/email"

    def execute(self, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password):
        return EmailNode.execute(self, "smtp.qq.com", 587, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password)


class GmailEmailNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "sender_email": ("STRING", {}),
                "receiver_email": ("STRING", {}),
                "subject": ("STRING", {}),
                "message_body": ("STRING", {"forceInput": True, }),
                "smtp_username": ("STRING", {}),
                "smtp_password": ("STRING", {}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "execute"
    DESCRIPTION = "Send an Gmail email"
    CATEGORY = "tools/email"

    def execute(self, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password):
        return EmailNode.execute(self, "smtp.gmail.com", 587, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password)


class OutlookEmailNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "sender_email": ("STRING", {}),
                "receiver_email": ("STRING", {}),
                "subject": ("STRING", {}),
                "message_body": ("STRING", {"forceInput": True, }),
                "smtp_username": ("STRING", {}),
                "smtp_password": ("STRING", {}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "execute"
    DESCRIPTION = "Send an Outlook email"
    CATEGORY = "tools/email"

    def execute(self, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password):
        return EmailNode.execute(self, "smtp.office365.com", 587, sender_email, receiver_email, subject, message_body, smtp_username, smtp_password)
