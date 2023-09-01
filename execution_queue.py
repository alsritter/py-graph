import threading
import copy
import heapq  # 堆队列算法

class RunnerQueue:
    def __init__(self, server):
        # 初始化 RunnerQueue 类的实例
        self.server = server  # 保存 server 实例
        self.mutex = threading.RLock()  # 创建可重入锁
        self.not_empty = threading.Condition(self.mutex)  # 创建条件变量
        self.task_counter = 0  # 任务计数器，用于生成任务 ID
        self.queue = []  # 任务队列，用于存储待执行的任务
        self.currently_running = {}  # 当前正在执行的任务，用于存储任务 ID 和任务信息
        self.history = {}  # 执行历史记录，用于存储已执行的任务信息
        server.runner_queue = self  # 将当前 RunnerQueue 实例保存到 server 实例中

    def put(self, item):
        # 将任务添加到任务队列中
        with self.mutex:
            heapq.heappush(self.queue, item)  # 使用堆来维护任务队列
            self.server.queue_updated()  # 通知 server 队列已更新
            self.not_empty.notify()  # 通知等待的线程队列不再为空

    def get(self):
        # 从任务队列中获取一个任务
        with self.not_empty:
            while len(self.queue) == 0:
                self.not_empty.wait()  # 如果队列为空，则等待队列不为空
            item = heapq.heappop(self.queue)  # 从队列中获取任务
            i = self.task_counter  # 生成任务 ID
            self.currently_running[i] = copy.deepcopy(item)  # 将任务信息保存到当前正在执行的任务中
            self.task_counter += 1  # 更新任务计数器
            self.server.queue_updated()  # 通知 server 队列已更新
            return (item, i)  # 返回任务信息和任务 ID

    def task_done(self, item_id, outputs):
        # 标记任务已完成，并保存任务执行结果
        with self.mutex:
            runner = self.currently_running.pop(item_id)  # 从当前正在执行的任务中删除任务信息
            self.history[runner[1]] = {"runner": runner, "outputs": {}}  # 将任务信息保存到历史记录中
            for o in outputs:
                self.history[runner[1]]["outputs"][o] = outputs[o]  # 将任务执行结果保存到历史记录中
            self.server.queue_updated()  # 通知 server 队列已更新

    def get_current_queue(self):
        # 获取当前正在执行的任务和任务队列
        with self.mutex:
            out = []
            for x in self.currently_running.values():
                out += [x]  # 将当前正在执行的任务保存到 out 列表中
            return (out, copy.deepcopy(self.queue))  # 返回当前正在执行的任务和任务队列的副本

    def get_tasks_remaining(self):
        # 获取剩余任务数量
        with self.mutex:
            return len(self.queue) + len(self.currently_running)  # 返回任务队列和当前正在执行的任务的数量之和

    def wipe_queue(self):
        # 清空任务队列
        with self.mutex:
            self.queue = []  # 将任务队列清空
            self.server.queue_updated()  # 通知 server 队列已更新

    def delete_queue_item(self, function):
        # 删除任务队列中符合条件的任务
        with self.mutex:
            for x in range(len(self.queue)):
                if function(self.queue[x]):
                    if len(self.queue) == 1:
                        self.wipe_queue()  # 如果队列中只有一个任务，则清空队列
                    else:
                        self.queue.pop(x)  # 删除符合条件的任务
                        heapq.heapify(self.queue)  # 重新维护堆的性质
                    self.server.queue_updated()  # 通知 server 队列已更新
                    return True
        return False

    def get_history(self, runner_id=None):
        # 获取历史记录
        with self.mutex:
            if runner_id is None:
                return copy.deepcopy(self.history)  # 返回历史记录的副本
            elif runner_id in self.history:
                return {runner_id: copy.deepcopy(self.history[runner_id])}  # 返回指定任务的历史记录的副本
            else:
                return {}  # 如果指定任务不存在历史记录，则返回空字典

    def wipe_history(self):
        # 清空历史记录
        with self.mutex:
            self.history = {}  # 将历史记录清空

    def delete_history_item(self, id_to_delete):
        # 删除指定的历史记录
        with self.mutex:
            self.history.pop(id_to_delete, None)  # 删除指定任务的历史记录