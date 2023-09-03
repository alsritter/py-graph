import nodes
import traceback
import sys

def validate_runner(runner):
    # 初始化输出节点集合
    outputs = set()
    # 遍历 runner 中的所有节点
    for x in runner:
        # 获取节点类
        class_ = nodes.NODE_CLASS_MAPPINGS[runner[x]['class_type']]
        # 如果节点类有 OUTPUT_NODE 属性且为 True，则将该节点加入输出节点集合
        if hasattr(class_, 'OUTPUT_NODE') and class_.OUTPUT_NODE == True:
            outputs.add(x)

    # 如果输出节点集合为空，则返回错误信息
    if len(outputs) == 0:
        error = {
            "type": "runner_no_outputs",
            "message": "runner has no outputs",
            "details": "",
            "extra_info": {}
        }
        return (False, error, [], [])

    # 初始化合法输出节点集合、错误信息列表、节点错误信息字典和已验证节点字典
    good_outputs = set()
    errors = []
    node_errors = {}
    validated = {}

    # 遍历输出节点集合中的所有节点
    for o in outputs:
        valid = False
        reasons = []
        try:
            # 验证节点的输入参数是否合法
            m = validate_inputs(runner, o, validated)
            valid = m[0]
            reasons = m[1]
        except Exception as ex:
            # 如果验证过程中出现异常，则记录异常信息
            typ, _, tb = sys.exc_info()
            valid = False
            exception_type = full_type_name(typ)
            reasons = [{
                "type": "exception_during_validation",
                "message": "Exception when validating node",
                "details": str(ex),
                "extra_info": {
                    "exception_type": exception_type,
                    "traceback": traceback.format_tb(tb)
                }
            }]
            validated[o] = (False, reasons, o)

        # 如果节点输入参数合法，则将该节点加入合法输出节点集合
        if valid is True:
            good_outputs.add(o)
        else:
            # 如果节点输入参数不合法，则记录错误信息，并将该节点及其依赖节点加入节点错误信息字典
            print(f"Failed to validate runner for output {o}:")
            if len(reasons) > 0:
                print("* (runner):")
                for reason in reasons:
                    print(f"  - {reason['message']}: {reason['details']}")
            errors += [(o, reasons)]
            for node_id, result in validated.items():
                valid = result[0]
                reasons = result[1]
                # 如果节点的上游节点有错误，则该节点也会被标记为无效，但是不会有错误信息附加在该节点上
                # 因此，在返回节点错误信息字典时，不应该包含这些节点
                if valid is not True and len(reasons) > 0:
                    if node_id not in node_errors:
                        class_type = runner[node_id]['class_type']
                        node_errors[node_id] = {
                            "errors": reasons,
                            "dependent_outputs": [],
                            "class_type": class_type
                        }
                        print(f"* {class_type} {node_id}:")
                        for reason in reasons:
                            print(
                                f"  - {reason['message']}: {reason['details']}")
                    node_errors[node_id]["dependent_outputs"].append(o)
            print("Output will be ignored")

    # 如果合法输出节点集合为空，则返回错误信息
    if len(good_outputs) == 0:
        errors_list = []
        for o, errors in errors:
            for error in errors:
                errors_list.append(f"{error['message']}: {error['details']}")
        errors_list = "\n".join(errors_list)

        error = {
            "type": "runner_outputs_failed_validation",
            "message": "runner outputs failed validation",
            "details": errors_list,
            "extra_info": {}
        }

        return (False, error, list(good_outputs), node_errors)

    # 如果所有输出节点都合法，则返回验证通过的信息和节点错误信息字典
    return (True, None, list(good_outputs), node_errors)


def full_type_name(klass):
    module = klass.__module__
    if module == 'builtins':
        return klass.__qualname__
    return module + '.' + klass.__qualname__


def validate_inputs(runner, item, validated):
    """
    根据节点的提示和类类型验证节点的输入。

    Args:
        runner (dict): 运行器对象。
        item (str): 要验证的节点的唯一 ID。
        validated (dict): 已验证节点的字典。

    Returns:
        tuple: 包含一个布尔值（指示验证是否成功）、一个错误列表（如果有）和已验证节点的唯一 ID 的元组。
    """
    unique_id = item
    if unique_id in validated:
        return validated[unique_id]

    inputs = runner[unique_id]['inputs']
    class_type = runner[unique_id]['class_type']
    obj_class = nodes.NODE_CLASS_MAPPINGS[class_type]

    class_inputs = obj_class.INPUT_TYPES()
    required_inputs = class_inputs['required']

    errors = []
    valid = True

    for x in required_inputs:
        if x not in inputs:
            error = {
                "type": "required_input_missing",
                "message": "缺少必需的输入",
                "details": f"{x}",
                "extra_info": {
                    "input_name": x
                }
            }
            errors.append(error)
            continue

        val = inputs[x]
        info = required_inputs[x]
        type_input = info[0]
        if isinstance(val, list):
            if len(val) != 2:
                error = {
                    "type": "bad_linked_input",
                    "message": "错误的链接输入，必须是长度为 2 的列表 [node_id，slot_index]",
                    "details": f"{x}",
                    "extra_info": {
                        "input_name": x,
                        "input_config": info,
                        "received_value": val
                    }
                }
                errors.append(error)
                continue

            o_id = val[0]
            o_class_type = runner[o_id]['class_type']
            r = nodes.NODE_CLASS_MAPPINGS[o_class_type].RETURN_TYPES
            if r[val[1]] != type_input:
                received_type = r[val[1]]
                details = f"{x}，{received_type} != {type_input}"
                error = {
                    "type": "return_type_mismatch",
                    "message": "链接节点之间的返回类型不匹配",
                    "details": details,
                    "extra_info": {
                        "input_name": x,
                        "input_config": info,
                        "received_type": received_type,
                        "linked_node": val
                    }
                }
                errors.append(error)
                continue
            try:
                r = validate_inputs(runner, o_id, validated)
                if r[0] is False:
                    # `r` 已经在 `validated[o_id]` 中设置
                    valid = False
                    continue
            except Exception as ex:
                typ, _, tb = sys.exc_info()
                valid = False
                exception_type = full_type_name(typ)
                reasons = [{
                    "type": "exception_during_inner_validation",
                    "message": "验证内部节点时出现异常",
                    "details": str(ex),
                    "extra_info": {
                        "input_name": x,
                        "input_config": info,
                        "exception_message": str(ex),
                        "exception_type": exception_type,
                        "traceback": traceback.format_tb(tb),
                        "linked_node": val
                    }
                }]
                validated[o_id] = (False, reasons, o_id)
                continue
        else:
            try:
                if type_input == "INT":
                    val = int(val)
                    inputs[x] = val
                if type_input == "FLOAT":
                    val = float(val)
                    inputs[x] = val
                if type_input == "STRING":
                    val = str(val)
                    inputs[x] = val
            except Exception as ex:
                error = {
                    "type": "invalid_input_type",
                    "message": f"无法将输入值转换为 {type_input} 值",
                    "details": f"{x}，{val}，{ex}",
                    "extra_info": {
                        "input_name": x,
                        "input_config": info,
                        "received_value": val,
                        "exception_message": str(ex)
                    }
                }
                errors.append(error)
                continue

            if len(info) > 1:
                if "min" in info[1] and val < info[1]["min"]:
                    error = {
                        "type": "value_smaller_than_min",
                        "message": "值 {} 小于最小值 {}".format(val, info[1]["min"]),
                        "details": f"{x}",
                        "extra_info": {
                            "input_name": x,
                            "input_config": info,
                            "received_value": val,
                        }
                    }
                    errors.append(error)
                    continue
                if "max" in info[1] and val > info[1]["max"]:
                    error = {
                        "type": "value_bigger_than_max",
                        "message": "值 {} 大于最大值 {}".format(val, info[1]["max"]),
                        "details": f"{x}",
                        "extra_info": {
                            "input_name": x,
                            "input_config": info,
                            "received_value": val,
                        }
                    }
                    errors.append(error)
                    continue

            # 如果节点有验证输入的自定义方法，则调用该方法
            if hasattr(obj_class, "VALIDATE_INPUTS"):
                input_data_all = get_input_data(inputs, obj_class, unique_id)
                ret = map_node_over_list(
                    obj_class, input_data_all, "VALIDATE_INPUTS")

                for i, r in enumerate(ret):
                    if r is not True:
                        details = f"{x}"
                        if r is not False:
                            details += f" - {str(r)}"

                        error = {
                            "type": "custom_validation_failed",
                            "message": "节点的自定义验证失败",
                            "details": details,
                            "extra_info": {
                                "input_name": x,
                                "input_config": info,
                                "received_value": val,
                            }
                        }
                        errors.append(error)
                        continue
            else:
                if isinstance(type_input, list):
                    if val not in type_input:
                        input_config = info
                        list_info = ""

                        # 不要像它们是大量扫描的模型文件路径那样发送回巨大的列表
                        if len(type_input) > 20:
                            list_info = f"(长度为 {len(type_input)} 的列表)"
                            input_config = None
                        else:
                            list_info = str(type_input)

                        error = {
                            "type": "value_not_in_list",
                            "message": "值不在列表中",
                            "details": f"{x}：'{val}' 不在 {list_info} 中",
                            "extra_info": {
                                "input_name": x,
                                "input_config": input_config,
                                "received_value": val,
                            }
                        }
                        errors.append(error)
                        continue

    if len(errors) > 0 or valid is not True:
        ret = (False, errors, unique_id)
    else:
        ret = (True, [], unique_id)

    validated[unique_id] = ret
    return ret


def get_input_data(inputs, class_def: nodes.BaseNode, unique_id, outputs={}):
    """
    从输入数据中获取节点的输入参数。

    Args:
        inputs (dict): 节点的输入参数。
        class_def (BaseNode): 节点的类定义。
        unique_id (str): 节点的唯一标识符。
        outputs (dict, optional): 所有节点的输出参数。默认为空字典。

    Returns:
        dict: 节点的输入参数字典。

    Raises:
        None

    """
    # 获取节点的有效输入参数类型
    valid_inputs = class_def.INPUT_TYPES()
    # 初始化节点的输入参数字典
    input_data_all = {}
    # 遍历节点的所有输入参数
    for x in inputs:
        input_data = inputs[x]
        # 如果输入参数是一个列表，则表示该参数是从其他节点的输出中获取的
        if isinstance(input_data, list):
            input_unique_id = input_data[0]
            output_index = input_data[1]
            # 如果输出节点中没有该节点的输出，则返回 None
            if input_unique_id not in outputs:
                return None
            # 获取该节点的输出对象，并将其加入节点的输入参数字典中
            obj = outputs[input_unique_id][output_index]
            input_data_all[x] = obj
        else:
            # 如果输入参数不是一个列表，则表示该参数是直接指定的
            # 如果该参数是必需的或可选的，则将其加入节点的输入参数字典中
            if ("required" in valid_inputs and x in valid_inputs["required"]) or ("optional" in valid_inputs and x in valid_inputs["optional"]):
                input_data_all[x] = [input_data]

    # 处理节点的隐藏输入参数
    if "hidden" in valid_inputs:
        h = valid_inputs["hidden"]
        for x in h:
            if h[x] == "UNIQUE_ID":
                input_data_all[x] = [unique_id]
    # 返回节点的输入参数字典
    return input_data_all


def get_output_data(obj: nodes.BaseNode, input_data_all):
    """
    获取节点执行结果。

    Args:
        obj (Node): 节点对象。
        input_data_all (dict): 节点输入数据字典。

    Returns:
        tuple: 包含节点执行结果和 UI 数据的元组。

    Raises:
        None

    """
    results = []
    uis = []
    return_values = map_node_over_list(
        obj, input_data_all, obj.FUNCTION, allow_interrupt=True)

    for r in return_values:
        if isinstance(r, dict):
            if 'ui' in r:
                uis.append(r['ui'])
            if 'result' in r:
                results.append(r['result'])
        else:
            results.append(r)

    output = []
    if len(results) > 0:
        # check which outputs need concatenating
        output_is_list = [False] * len(results[0])
        if hasattr(obj, "OUTPUT_IS_LIST"):
            output_is_list = obj.OUTPUT_IS_LIST

        # merge node execution results
        for i, is_list in zip(range(len(results[0])), output_is_list):
            if is_list:
                output.append([x for o in results for x in o[i]])
            else:
                output.append([o[i] for o in results])

    ui = dict()
    if len(uis) > 0:
        ui = {k: [y for x in uis for y in x[k]] for k in uis[0].keys()}
    return output, ui


def format_value(x):
    if x is None:
        return None
    elif isinstance(x, (int, float, bool, str)):
        return x
    else:
        return str(x)


def recursive_execute(server, runners, outputs, current_item, extra_data, executed, runner_id, outputs_ui, object_storage):
    """
    递归执行节点。

    Args:
        server (Server): 服务器对象。
        runners (dict): 节点运行器字典。
        outputs (dict): 节点输出数据字典。
        current_item (str): 当前节点 ID。
        extra_data (dict): 额外数据字典。
        executed (set): 已执行节点 ID 集合。
        runner_id (str): 运行器 ID。
        outputs_ui (dict): 节点 UI 数据字典。
        object_storage (dict): 对象存储字典。

    Returns:
        tuple: 包含执行结果、错误详情和异常对象的元组。

    Raises:
        None

    """
    unique_id = current_item
    inputs = runners[unique_id]['inputs']
    class_type = runners[unique_id]['class_type']
    class_def = nodes.NODE_CLASS_MAPPINGS[class_type]
    if unique_id in outputs:
        return (True, None, None)

    for x in inputs:
        input_data = inputs[x]

        if isinstance(input_data, list):
            input_unique_id = input_data[0]
            output_index = input_data[1]
            if input_unique_id not in outputs:
                result = recursive_execute(server, runners, outputs, input_unique_id,
                                           extra_data, executed, runner_id, outputs_ui, object_storage)
                if result[0] is not True:
                    # Another node failed further upstream
                    return result

    input_data_all = None
    try:
        input_data_all = get_input_data(
            inputs, class_def, unique_id, outputs, runners, extra_data)
        if server.client_id is not None:
            server.last_node_id = unique_id
            server.send_sync(
                "executing", {"node": unique_id, "runner_id": runner_id}, server.client_id)

        obj = object_storage.get((unique_id, class_type), None)
        if obj is None:
            obj = class_def()
            object_storage[(unique_id, class_type)] = obj

        output_data, output_ui = get_output_data(obj, input_data_all)
        outputs[unique_id] = output_data
        if len(output_ui) > 0:
            outputs_ui[unique_id] = output_ui
            if server.client_id is not None:
                server.send_sync("executed", {
                                 "node": unique_id, "output": output_ui, "runner_id": runner_id}, server.client_id)
        print("Processing interrupted")

        # skip formatting inputs/outputs
        error_details = {
            "node_id": unique_id,
        }
    except Exception as ex:
        typ, _, tb = sys.exc_info()
        exception_type = full_type_name(typ)
        input_data_formatted = {}
        if input_data_all is not None:
            input_data_formatted = {}
            for name, inputs in input_data_all.items():
                input_data_formatted[name] = [format_value(x) for x in inputs]

        output_data_formatted = {}
        for node_id, node_outputs in outputs.items():
            output_data_formatted[node_id] = [
                [format_value(x) for x in l] for l in node_outputs]

        print("!!! Exception during processing !!!")
        print(traceback.format_exc())

        error_details = {
            "node_id": unique_id,
            "exception_message": str(ex),
            "exception_type": exception_type,
            "traceback": traceback.format_tb(tb),
            "current_inputs": input_data_formatted,
            "current_outputs": output_data_formatted
        }
        return (False, error_details, ex)

    executed.add(unique_id)

    return (True, None, None)


def recursive_output_delete_if_changed(runners, old_runners, outputs, current_item):
    """
    递归删除已更改的输出节点。

    Args:
        runners (dict): 节点图的节点字典。
        old_runners (dict): 节点图的旧节点字典。
        outputs (dict): 节点图的输出节点字典。
        current_item (str): 当前节点 ID。

    Returns:
        bool: 是否需要删除当前节点。

    Raises:
        None

    """
    unique_id = current_item
    inputs = runners[unique_id]['inputs']
    class_type = runners[unique_id]['class_type']
    class_def = nodes.NODE_CLASS_MAPPINGS[class_type]

    is_changed_old = ''
    is_changed = ''
    to_delete = False
    if hasattr(class_def, 'IS_CHANGED'):
        if unique_id in old_runners and 'is_changed' in old_runners[unique_id]:
            is_changed_old = old_runners[unique_id]['is_changed']
        if 'is_changed' not in runners[unique_id]:
            input_data_all = get_input_data(
                inputs, class_def, unique_id, outputs)
            if input_data_all is not None:
                try:
                    # is_changed = class_def.IS_CHANGED(**input_data_all)
                    is_changed = map_node_over_list(
                        class_def, input_data_all, "IS_CHANGED")
                    runners[unique_id]['is_changed'] = is_changed
                except:
                    to_delete = True
        else:
            is_changed = runners[unique_id]['is_changed']

    if unique_id not in outputs:
        return True

    if not to_delete:
        if is_changed != is_changed_old:
            to_delete = True
        elif unique_id not in old_runners:
            to_delete = True
        elif inputs == old_runners[unique_id]['inputs']:
            for x in inputs:
                input_data = inputs[x]

                if isinstance(input_data, list):
                    input_unique_id = input_data[0]
                    output_index = input_data[1]
                    if input_unique_id in outputs:
                        to_delete = recursive_output_delete_if_changed(
                            runners, old_runners, outputs, input_unique_id)
                    else:
                        to_delete = True
                    if to_delete:
                        break
        else:
            to_delete = True

    if to_delete:
        d = outputs.pop(unique_id)
        del d
    return to_delete


def recursive_will_execute(runners, outputs, current_item):
    """
    递归查找将要执行的节点。

    Args:
        runners (dict): 节点图的节点字典。
        outputs (dict): 节点图的输出节点字典。
        current_item (str): 当前节点 ID。

    Returns:
        list: 将要执行的节点 ID 列表。

    Raises:
        None

    """
    unique_id = current_item
    inputs = runners[unique_id]['inputs']
    will_execute = []
    if unique_id in outputs:
        return []

    for x in inputs:
        input_data = inputs[x]
        if isinstance(input_data, list):
            input_unique_id = input_data[0]
            output_index = input_data[1]
            if input_unique_id not in outputs:
                will_execute += recursive_will_execute(
                    runners, outputs, input_unique_id)

    return will_execute + [unique_id]


def map_node_over_list(obj: nodes.BaseNode, input_data_all, func):
    """
    对节点的输入参数列表进行映射，并返回执行结果列表。

    Args:
        obj (BaseNode): 节点对象。
        input_data_all (dict): 节点的输入参数字典。
        func (str): 节点的执行方法名称。

    Returns:
        list: 节点执行结果列表。

    Raises:
        None

    """
    # 检查节点是否需要处理输入参数列表
    input_is_list = False
    if hasattr(obj, "INPUT_IS_LIST"):
        input_is_list = obj.INPUT_IS_LIST

    # 计算输入参数列表的最大长度
    if len(input_data_all) == 0:
        max_len_input = 0
    else:
        max_len_input = max([len(x) for x in input_data_all.values()])

    # 定义一个函数，用于获取输入参数列表的一个切片，并在列表长度不足时重复最后一个元素
    def slice_dict(d, i):
        d_new = dict()
        for k, v in d.items():
            d_new[k] = v[i if len(v) > i else -1]
        return d_new

    # 初始化节点执行结果列表
    results = []
    # 如果节点需要处理输入参数列表，则将整个列表作为参数传入节点的执行方法中
    if input_is_list:
        results.append(getattr(obj, func)(**input_data_all))
    # 如果输入参数列表为空，则直接调用节点的执行方法
    elif max_len_input == 0:
        results.append(getattr(obj, func)())
    # 否则，对输入参数列表进行遍历，并将每个元素作为参数传入节点的执行方法中
    else:
        for i in range(max_len_input):
            results.append(getattr(obj, func)(**slice_dict(input_data_all, i)))
    # 返回节点执行结果列表
    return results
