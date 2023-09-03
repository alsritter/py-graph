import execution_tools
import copy


class RunnerExecutor:
    def __init__(self, server):
        self.outputs = {}
        self.object_storage = {}
        self.outputs_ui = {}
        self.old_runner = {}
        self.server = server

    def handle_execution_error(self, runner_id, runners, current_outputs, executed, error, ex):
        node_id = error["node_id"]
        class_type = runners[node_id]["class_type"]

        if self.server.client_id is not None:
            mes = {
                "runner_id": runner_id,
                "node_id": node_id,
                "node_type": class_type,
                "executed": list(executed),
                "exception_message": error["exception_message"],
                "exception_type": error["exception_type"],
                "traceback": error["traceback"],
                "current_inputs": error["current_inputs"],
                "current_outputs": error["current_outputs"],
            }
            self.server.send_sync("execution_error", mes,
                                  self.server.client_id)

        # Next, remove the subsequent outputs since they will not be executed
        to_delete = []
        for o in self.outputs:
            if (o not in current_outputs) and (o not in executed):
                to_delete += [o]
                if o in self.old_runner:
                    d = self.old_runner.pop(o)
                    del d
        for o in to_delete:
            d = self.outputs.pop(o)
            del d

    def execute(self, runners, runner_id, extra_data={}, execute_outputs=[]):
        """
        执行节点图。

        Args:
            runners (dict): 节点图的节点字典。
            runner_id (str): 节点图的 ID。
            extra_data (dict, optional): 额外的数据字典。默认为空字典。
            execute_outputs (list, optional): 要执行的输出节点 ID 列表。默认为空列表。

        Returns:
            None

        Raises:
            None

        """
        # 如果额外数据字典中包含客户端 ID，则将其设置为节点图的客户端 ID
        if "client_id" in extra_data:
            self.server.client_id = extra_data["client_id"]
        else:
            self.server.client_id = None

        # 如果节点图有客户端 ID，则发送“execution_start”消息
        if self.server.client_id is not None:
            self.server.send_sync("execution_start", {
                                  "runner_id": runner_id}, self.server.client_id)

        # 删除缓存输出列表中不存在的节点
        to_delete = []
        for o in self.outputs:
            if o not in runners:
                to_delete += [o]
        for o in to_delete:
            d = self.outputs.pop(o)
            del d
        to_delete = []
        for o in self.object_storage:
            if o[0] not in runners:
                to_delete += [o]
            else:
                p = runners[o[0]]
                if o[1] != p['class_type']:
                    to_delete += [o]
        for o in to_delete:
            d = self.object_storage.pop(o)
            del d

        # 删除输出节点的缓存输出列表中已经不存在的输出节点
        for x in runners:
            execution_tools.recursive_output_delete_if_changed(
                runners, self.old_runner, self.outputs, x)

        # 获取当前输出节点列表
        current_outputs = set(self.outputs.keys())
        # 删除输出节点 UI 列表中已经不存在的输出节点
        for x in list(self.outputs_ui.keys()):
            if x not in current_outputs:
                d = self.outputs_ui.pop(x)
                del d

        # 如果节点图有客户端 ID，则发送“execution_cached”消息
        if self.server.client_id is not None:
            self.server.send_sync("execution_cached", {"nodes": list(
                current_outputs), "runner_id": runner_id}, self.server.client_id)

        # 初始化已执行节点集合、输出节点 ID 和待执行节点列表
        executed = set()
        output_node_id = None
        to_execute = []
        for node_id in list(execute_outputs):
            to_execute += [(0, node_id)]

        # 循环执行待执行节点列表中的节点
        while len(to_execute) > 0:
            # 总是先执行依赖于未执行节点最少的输出节点
            to_execute = sorted(list(map(lambda a: (
                len(execution_tools.recursive_will_execute(runners, self.outputs, a[-1])), a[-1]), to_execute)))
            output_node_id = to_execute.pop(0)[-1]

            # 递归执行输出节点的执行方法
            success, error, ex = execution_tools.recursive_execute(
                self.server, runners, self.outputs, output_node_id, extra_data, executed, runner_id, self.outputs_ui, self.object_storage)
            # 如果执行失败，则处理执行错误
            if success is not True:
                self.handle_execution_error(
                    runner_id, runners, current_outputs, executed, error, ex)
                break

        # 将已执行节点的状态更新到旧节点字典中
        for x in executed:
            self.old_runner[x] = copy.deepcopy(runners[x])
        self.server.last_node_id = None
