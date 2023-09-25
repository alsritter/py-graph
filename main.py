import server
import asyncio
import webbrowser
import execution
import execution_queue
import threading
import internal.utils
from nodes import init_custom_nodes
import time
import gc

from server import BinaryEventTypes, PyGraphServer


def runner_worker(queue: execution_queue.RunnerQueue, server):
    e = execution.RunnerExecutor(server)
    while True:
        item, item_id = queue.get()
        execution_start_time = time.perf_counter()
        runner_id = item[1]
        e.execute(item[2], runner_id, item[3], item[4])
        queue.task_done(item_id, e.outputs_ui)
        if server.client_id is not None:
            server.send_sync(
                "executing", {"node": None,
                              "runner_id": runner_id}, server.client_id
            )

        print(
            "runner executed in {:.2f} seconds".format(
                time.perf_counter() - execution_start_time
            )
        )

        # 手动触发垃圾回收。
        gc.collect()


async def run(
    server: PyGraphServer, address="", port=8188, verbose=True, call_on_start=None
):
    await asyncio.gather(
        server.start(address, port, verbose,
                     call_on_start), server.publish_loop()
    )


def hijack_progress(server):
    def hook(value, total, preview: internal.utils.PreviewType):
        server.send_sync(
            "progress", {"value": value, "max": total}, server.client_id)
        if preview is not None:
            if preview.type == "image":
                server.send_sync(
                    BinaryEventTypes.UNENCODED_PREVIEW_IMAGE,
                    preview.data,
                    server.client_id,
                )

    internal.utils.set_progress_bar_global_hook(hook)


if __name__ == "__main__":
    init_custom_nodes()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = server.PyGraphServer(loop)
    queue = execution_queue.RunnerQueue(server)
    server.add_routes()
    hijack_progress(server)

    webbrowser.open("http://127.0.0.1:5000")

    threading.Thread(
        target=runner_worker,
        daemon=True,
        args=(
            queue,
            server,
        ),
    ).start()

    loop.run_until_complete(run(server, "127.0.0.1", 5000))
    loop.run_forever()
