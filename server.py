from aiohttp import web
from typing import Optional, Dict
import aiohttp
import asyncio
import uuid
import mimetypes  # 映射文件名到 MIME 类型
import nodes
import glob
import os
import struct
import execution
import execution_tools
import execution_queue


class BinaryEventTypes:
    PREVIEW_TEXT = 1


async def send_socket_catch_exception(function, message):
    try:
        await function(message)
    except (aiohttp.ClientError, aiohttp.ClientPayloadError, ConnectionResetError) as err:
        print("send error:", err)


@web.middleware
async def cache_control(request: web.Request, handler):
    response: web.Response = await handler(request)
    if request.path.endswith('.js') or request.path.endswith('.css'):
        response.headers.setdefault('Cache-Control', 'no-cache')
    return response


def create_cors_middleware(allowed_origin: str):
    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        if request.method == "OPTIONS":
            # Pre-flight request. Reply successfully:
            response = web.Response()
        else:
            response = await handler(request)

        response.headers['Access-Control-Allow-Origin'] = allowed_origin
        response.headers['Access-Control-Allow-Methods'] = 'POST, GET, DELETE, PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    return cors_middleware


class PyGraphServer:
    def __init__(self, loop):
        # instance 属性用于存储 PyGraphServer 类的单例实例
        PyGraphServer.instance = self
        mimetypes.init()
        mimetypes.types_map['.js'] = 'application/javascript; charset=utf-8'

        self.number = 0
        self.runner_queue: execution_queue.RunnerQueue = None
        self.loop = loop
        # Queue 是 asyncio 模块中的一个类，用于实现异步队列。
        # 异步队列是一种特殊的队列，它可以在异步程序中安全地传递和共享数据。
        # 异步队列通常用于协调异步任务之间的通信和同步。
        self.messages = asyncio.Queue()
        # 设置静态文件路径
        self.web_root = os.path.join(
            os.path.dirname(os.path.realpath(__file__)), "web")
        middlewares = [cache_control]
        middlewares.append(create_cors_middleware('*'))
        self.app = web.Application(middlewares=middlewares)
        routes = web.RouteTableDef()
        self.routes = routes
        # 保存客户端连接
        self.sockets: Dict[str, web.WebSocketResponse] = dict()
        self.client_id = None
        self.last_node_id = None

        @routes.get('/ws')
        async def websocket_handler(request: web.Request):
            ws = web.WebSocketResponse()
            await ws.prepare(request)
            sid = request.rel_url.query.get('clientId', '')
            if sid:
                # Reusing existing session, remove old
                self.sockets.pop(sid, None)
            else:
                sid = uuid.uuid4().hex

            self.sockets[sid] = ws

            try:
                # Send initial state to the new client
                await self.send("status", {"status": self.get_queue_info(), 'sid': sid}, sid)
                # On reconnect if we are the currently executing client send the current node
                if self.client_id == sid and self.last_node_id is not None:
                    await self.send("executing", {"node": self.last_node_id}, sid)

                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.ERROR:
                        print('ws connection closed with exception %s' %
                              ws.exception())
            finally:
                self.sockets.pop(sid, None)
            return ws

        @routes.get("/")
        async def get_root(request: web.Request):
            return web.FileResponse(os.path.join(self.web_root, "index.html"))

        @routes.get('/extensions')
        async def get_extensions(request: web.Request):
            files = glob.glob(os.path.join(
                self.web_root, 'extensions/**/*.js'), recursive=True)
            return web.json_response(list(map(lambda f: "/" + os.path.relpath(f, self.web_root).replace("\\", "/"), files)))

        @routes.get('/object_info')
        async def get_object_info(request: web.Request):
            out = {}
            for x in nodes.NODE_CLASS_MAPPINGS:
                out[x] = node_info(x)
            return web.json_response(out)

        @routes.get("/object_info/{node_class}")
        async def get_object_info_node(request: web.Request):
            node_class = request.match_info.get("node_class", None)
            out = {}
            if (node_class is not None) and (node_class in nodes.NODE_CLASS_MAPPINGS):
                out[node_class] = node_info(node_class)
            return web.json_response(out)

        @routes.get("/queue")
        async def get_queue(request: web.Request):
            queue_info = {}
            current_queue = self.runner_queue.get_current_queue()
            queue_info['queue_running'] = current_queue[0]
            queue_info['queue_pending'] = current_queue[1]
            return web.json_response(queue_info)

        @routes.get("/runner")
        async def get_prompt(request):
            return web.json_response(self.get_queue_info())


        @routes.get("/history")
        async def get_history(request: web.Request):
            return web.json_response(self.runner_queue.get_history())

        @routes.get("/history/{runner_id}")
        async def get_history(request: web.Request):
            runner_id = request.match_info.get("runner_id", None)
            return web.json_response(self.runner_queue.get_history(runner_id=runner_id))

        @routes.post("/history")
        async def post_history(request: web.Request):
            json_data = await request.json()
            if "clear" in json_data:
                if json_data["clear"]:
                    self.runner_queue.wipe_history()
            if "delete" in json_data:
                to_delete = json_data['delete']
                for id_to_delete in to_delete:
                    self.runner_queue.delete_history_item(id_to_delete)

            return web.Response(status=200)

        @routes.post('/execute')
        async def execute(request: web.Request):
            json_data = await request.json()
            print(json_data)

            if "number" in json_data:
                number = float(json_data['number'])
            else:
                number = self.number
                if "front" in json_data:
                    if json_data['front']:
                        number = -number

                self.number += 1
            if "runner" in json_data:
                runner = json_data["runner"]
                valid = execution_tools.validate_runner(runner)
                extra_data = {}
                if "extra_data" in json_data:
                    extra_data = json_data["extra_data"]

                if "client_id" in json_data:
                    extra_data["client_id"] = json_data["client_id"]
                if valid[0]:
                    runner_id = str(uuid.uuid4())
                    outputs_to_execute = valid[2]
                    self.runner_queue.put(
                        (number, runner_id, runner, extra_data, outputs_to_execute))
                    response = {"runner_id": runner_id,
                                "number": number, "node_errors": valid[3]}
                    return web.json_response(response)
                else:
                    print("invalid runner:", valid[1])
                    return web.json_response({"error": valid[1], "node_errors": valid[3]}, status=400)
            else:
                return web.json_response({"error": "no runner", "node_errors": []}, status=400)

        def node_info(node_class):
            obj_class = nodes.NODE_CLASS_MAPPINGS[node_class]
            info = {}
            info['input'] = obj_class.INPUT_TYPES()
            info['output'] = obj_class.RETURN_TYPES
            info['output_is_list'] = obj_class.OUTPUT_IS_LIST if hasattr(
                obj_class, 'OUTPUT_IS_LIST') else [False] * len(obj_class.RETURN_TYPES)
            info['output_name'] = obj_class.RETURN_NAMES if hasattr(
                obj_class, 'RETURN_NAMES') else info['output']
            info['name'] = node_class
            info['display_name'] = nodes.NODE_DISPLAY_NAME_MAPPINGS[node_class] if node_class in nodes.NODE_DISPLAY_NAME_MAPPINGS.keys(
            ) else node_class
            info['description'] = obj_class.DESCRIPTION if hasattr(
                obj_class, 'DESCRIPTION') else ''
            info['category'] = 'sd'
            if hasattr(obj_class, 'OUTPUT_NODE') and obj_class.OUTPUT_NODE == True:
                info['output_node'] = True
            else:
                info['output_node'] = False

            if hasattr(obj_class, 'CATEGORY'):
                info['category'] = obj_class.CATEGORY
            return info

    async def send(self, event, data, sid=None):
        if event == BinaryEventTypes.PREVIEW_TEXT:
            await self.send_bytes(data, sid=sid)

    async def send_bytes(self, event: int, data: bytes, sid: Optional[str] = None) -> None:
        message = self.encode_bytes(event, data)
        if sid is None:
            for ws in self.sockets.values():
                await send_socket_catch_exception(ws.send_bytes, message)
        elif sid in self.sockets:
            await send_socket_catch_exception(self.sockets[sid].send_bytes, message)

    def get_queue_info(self):
        runner_info = {}
        exec_info = {}
        exec_info['queue_remaining'] = self.runner_queue.get_tasks_remaining()
        runner_info['exec_info'] = exec_info
        return runner_info

    def encode_bytes(self, event, data):
        # 检查 event 是否为整数类型，如果不是则抛出 RuntimeError 异常。
        if not isinstance(event, int):
            raise RuntimeError(
                f"Binary event types must be integers, got {event}")

        # 格式化字符串 ">I" 表示打包一个大端字节序的无符号整数。其中，>表示大端字节序，I表示无符号整数。
        packed = struct.pack(">I", event)
        # 将 packed 转换为一个可变字节数组，并将结果赋值给变量 message。
        message = bytearray(packed)
        # 将 data 中的字节追加到 message 中
        message.extend(data)
        return message

    def add_routes(self):
        self.app.add_routes(self.routes)
        self.app.add_routes([
            web.static('/', self.web_root, follow_symlinks=True),
        ])

    # 队列用来更新状态的回调函数
    def queue_updated(self):
        self.send_sync("status", {"status": self.get_queue_info()})

    def send_sync(self, event, data, sid=None):
        self.loop.call_soon_threadsafe(
            self.messages.put_nowait, (event, data, sid))

    async def start(self, address, port, verbose=True, call_on_start=None):
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, address, port)
        await site.start()

        if address == '':
            address = '0.0.0.0'
        if verbose:
            print("Starting server\n")
            print("To see the GUI go to: http://{}:{}".format(address, port))
        if call_on_start is not None:
            call_on_start(address, port)
