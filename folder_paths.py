import os
import time

supported_ckpt_extensions = set(['.ckpt', '.pth', '.safetensors'])
supported_pt_extensions = set(['.ckpt', '.pt', '.bin', '.pth', '.safetensors'])

folder_names_and_paths = {}
base_path = os.path.dirname(os.path.realpath(__file__))
output_directory = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), "output")
temp_directory = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), "temp")
input_directory = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), "input")

filename_list_cache = {}

if not os.path.exists(input_directory):
    os.makedirs(input_directory)


def set_output_directory(output_dir):
    global output_directory
    output_directory = output_dir


def set_temp_directory(temp_dir):
    global temp_directory
    temp_directory = temp_dir


def get_output_directory():
    global output_directory
    return output_directory


def get_temp_directory():
    global temp_directory
    return temp_directory


def get_input_directory():
    global input_directory
    return input_directory


def get_folder_paths(folder_name):
    return folder_names_and_paths[folder_name][0][:]


def recursive_search(directory):
    if not os.path.isdir(directory):
        return [], {}
    result = []
    dirs = {directory: os.path.getmtime(directory)}
    for root, subdir, file in os.walk(directory, followlinks=True):
        for filepath in file:
            # we os.path,join directory with a blank string to generate a path separator at the end.
            result.append(os.path.join(root, filepath).replace(
                os.path.join(directory, ''), ''))
        for d in subdir:
            path = os.path.join(root, d)
            dirs[path] = os.path.getmtime(path)
    return result, dirs


def filter_files_extensions(files, extensions):
    return sorted(list(filter(lambda a: os.path.splitext(a)[-1].lower() in extensions, files)))


def get_full_path(folder_name, filename):
    global folder_names_and_paths
    if folder_name not in folder_names_and_paths:
        return None
    folders = folder_names_and_paths[folder_name]
    filename = os.path.relpath(os.path.join("/", filename), "/")
    for x in folders[0]:
        full_path = os.path.join(x, filename)
        if os.path.isfile(full_path):
            return full_path

    return None


def get_filename_list_(folder_name):
    global folder_names_and_paths
    output_list = set()
    folders = folder_names_and_paths[folder_name]
    output_folders = {}
    for x in folders[0]:
        files, folders_all = recursive_search(x)
        output_list.update(filter_files_extensions(files, folders[1]))
        output_folders = {**output_folders, **folders_all}

    return (sorted(list(output_list)), output_folders, time.perf_counter())


def cached_filename_list_(folder_name):
    global filename_list_cache
    global folder_names_and_paths
    if folder_name not in filename_list_cache:
        return None
    out = filename_list_cache[folder_name]
    if time.perf_counter() < (out[2] + 0.5):
        return out
    for x in out[1]:
        time_modified = out[1][x]
        folder = x
        if os.path.getmtime(folder) != time_modified:
            return None

    folders = folder_names_and_paths[folder_name]
    for x in folders[0]:
        if os.path.isdir(x):
            if x not in out[1]:
                return None

    return out


def get_filename_list(folder_name):
    out = cached_filename_list_(folder_name)
    if out is None:
        out = get_filename_list_(folder_name)
        global filename_list_cache
        filename_list_cache[folder_name] = out
    return list(out[0])


def get_save_image_path(filename_prefix, output_dir, image_width=0, image_height=0):
    def map_filename(filename):
        prefix_len = len(os.path.basename(filename_prefix))
        prefix = filename[:prefix_len + 1]
        try:
            digits = int(filename[prefix_len + 1:].split('_')[0])
        except:
            digits = 0
        return (digits, prefix)

    def compute_vars(input, image_width, image_height):
        input = input.replace("%width%", str(image_width))
        input = input.replace("%height%", str(image_height))
        return input

    filename_prefix = compute_vars(filename_prefix, image_width, image_height)

    subfolder = os.path.dirname(os.path.normpath(filename_prefix))
    filename = os.path.basename(os.path.normpath(filename_prefix))

    full_output_folder = os.path.join(output_dir, subfolder)

    if os.path.commonpath((output_dir, os.path.abspath(full_output_folder))) != output_dir:
        print("Saving image outside the output folder is not allowed.")
        return {}

    try:
        counter = max(filter(lambda a: a[1][:-1] == filename and a[1][-1] == "_", map(
            map_filename, os.listdir(full_output_folder))))[0] + 1
    except ValueError:
        counter = 1
    except FileNotFoundError:
        os.makedirs(full_output_folder, exist_ok=True)
        counter = 1
    return full_output_folder, filename, counter, subfolder, filename_prefix
