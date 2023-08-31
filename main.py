import asyncio
from aiohttp import web
import mimetypes # 映射文件名到 MIME 类型
import nodes
import glob
import os

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
    def __init__(self):
        mimetypes.init()
        mimetypes.types_map['.js'] = 'application/javascript; charset=utf-8'

        # 设置静态文件路径
        self.web_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")
        middlewares = [cache_control]
        middlewares.append(create_cors_middleware('*'))
        self.app = web.Application(middlewares=middlewares)
        routes = web.RouteTableDef()
        self.routes = routes

        @routes.get("/")
        async def get_root(request):
            return web.FileResponse(os.path.join(self.web_root, "index.html"))

        @routes.get('/extensions')
        async def get_extensions(request):
            files = glob.glob(os.path.join(self.web_root, 'extensions/**/*.js'), recursive=True)
            return web.json_response(list(map(lambda f: "/" + os.path.relpath(f, self.web_root).replace("\\", "/"), files)))

        @routes.get('/object_info')
        async def get_object_info(request):
            out = {}
            for x in nodes.NODE_CLASS_MAPPINGS:
                out[x] = node_info(x)
            return web.json_response(out)

        def node_info(node_class):
            obj_class = nodes.NODE_CLASS_MAPPINGS[node_class]
            info = {}
            info['input'] = obj_class.INPUT_TYPES()
            info['output'] = obj_class.RETURN_TYPES
            info['output_is_list'] = obj_class.OUTPUT_IS_LIST if hasattr(obj_class, 'OUTPUT_IS_LIST') else [False] * len(obj_class.RETURN_TYPES)
            info['output_name'] = obj_class.RETURN_NAMES if hasattr(obj_class, 'RETURN_NAMES') else info['output']
            info['name'] = node_class
            info['display_name'] = nodes.NODE_DISPLAY_NAME_MAPPINGS[node_class] if node_class in nodes.NODE_DISPLAY_NAME_MAPPINGS.keys() else node_class
            info['description'] = obj_class.DESCRIPTION if hasattr(obj_class, 'DESCRIPTION') else ''
            info['category'] = 'sd'
            if hasattr(obj_class, 'OUTPUT_NODE') and obj_class.OUTPUT_NODE == True:
                info['output_node'] = True
            else:
                info['output_node'] = False

            if hasattr(obj_class, 'CATEGORY'):
                info['category'] = obj_class.CATEGORY
            return info

    def add_routes(self):
        self.app.add_routes(self.routes)
        self.app.add_routes([
            web.static('/', self.web_root, follow_symlinks=True),
        ])

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

if __name__ == '__main__':
    server = PyGraphServer()
    server.add_routes()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(server.start('127.0.0.1', 5000))
    loop.run_forever()
