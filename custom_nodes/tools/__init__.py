from .email import EmailNode, QQEmailNode, GmailEmailNode, OutlookEmailNode


NODE_CLASS_MAPPINGS = {
    "EmailNode": EmailNode,
    "QQEmailNode": QQEmailNode,
    "GmailEmailNode": GmailEmailNode,
    "OutlookEmailNode": OutlookEmailNode,
}
