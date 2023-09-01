import server
import asyncio
import webbrowser
import execution
import execution_queue
import threading
import time
import gc

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
                "executing", {"node": None, "runner_id": runner_id}, server.client_id)

        print("runner executed in {:.2f} seconds".format(
            time.perf_counter() - execution_start_time))
        gc.collect()


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    server = server.PyGraphServer(loop)
    queue = execution_queue.RunnerQueue(server)
    server.add_routes()
    webbrowser.open('http://127.0.0.1:5000')
    
    threading.Thread(target=runner_worker, daemon=True, args=(queue, server,)).start()

    loop.run_until_complete(server.start('127.0.0.1', 5000))
    loop.run_forever()
