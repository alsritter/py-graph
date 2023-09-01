import nodes
import threading


class NodeExecutor:
    def __init__(self, workflow_json):
        self.workflow = workflow_json
        self.nodes = workflow_json['workflow']['nodes']
        self.node_outputs = workflow_json['output']

    def execute(self):
        results = {}

        for node_id, node_data in self.node_outputs.items():
            class_type = node_data['class_type']
            inputs = node_data['inputs']

            result = self.execute_node(class_type, inputs)
            results[node_id] = result

        return results

    def execute_node(self, class_type, inputs):
        node_class = nodes.NODE_CLASS_MAPPINGS.get(class_type)

        if node_class is None:
            return None  # Node class not found

        node_instance = node_class()

        input_values = {}
        for input_name, input_link in inputs.items():
            input_value = self.get_input_value(input_link)
            input_values[input_name] = input_value

        if hasattr(node_instance, node_class.FUNCTION):
            function_name = getattr(node_class, "FUNCTION")
            function = getattr(node_instance, function_name)

            if callable(function):
                function_args = [node_instance] + [input_values.get(
                    param_name, 0) for param_name in function.__code__.co_varnames[1:]]
                result = function(*function_args)
                return result

        return None

    def get_input_value(self, input_link):
        if input_link is None:
            return 0  # Default value when no link is provided

        linked_node_id, output_index = input_link
        linked_node = next(
            (node for node in self.nodes if node['id'] == linked_node_id), None)

        if linked_node is None:
            return 0  # Linked node not found

        linked_output_name = linked_node['outputs'][output_index]['name']

        if 'links' in linked_node['outputs'][output_index]:
            output_links = linked_node['outputs'][output_index]['links']
            if output_links is not None and len(output_links) > 0:
                linked_output_id = output_links[0]
                linked_output_value = self.execute_node(
                    linked_node['type'], {})
                return linked_output_value

        return 0


class RunnerQueue:
    def __init__(self, server):
        self.server = server
        self.mutex = threading.RLock()
        self.not_empty = threading.Condition(self.mutex)
        self.task_counter = 0
        self.queue = []
        self.currently_running = {}
        self.history = {}
        server.runner_queue = self
