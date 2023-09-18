export const stringify = (val, depth, replacer, space, onGetObjID) => {
    depth = isNaN(+depth) ? 1 : depth;
    var recursMap = new WeakMap();
    function _build(val, depth, o, a, r) {
        return !val || typeof val != 'object'
            ? val
            : ((r = recursMap.has(val)),
                recursMap.set(val, true),
                (a = Array.isArray(val)),
                r
                    ? (o = (onGetObjID && onGetObjID(val)) || null)
                    : JSON.stringify(val, function (k, v) {
                        if (a || depth > 0) {
                            if (replacer)
                                v = replacer(k, v);
                            if (!k)
                                return (a = Array.isArray(v)), (val = v);
                            !o && (o = a ? [] : {});
                            o[k] = _build(v, a ? depth : depth - 1);
                        }
                    }),
                o === void 0 ? (a ? [] : {}) : o);
    }
    return JSON.stringify(_build(val, depth), null, space);
};
export const jsonReplacer = (k, v, ui) => {
    if (v instanceof Array && v.length === 1) {
        v = v[0];
    }
    if (v instanceof Date) {
        v = v.toISOString();
        if (ui) {
            v = v.split('T')[1];
        }
    }
    if (v instanceof Error) {
        let err = '';
        if (v.name)
            err += v.name + '\n';
        if (v.message)
            err += v.message + '\n';
        if (v.stack)
            err += v.stack + '\n';
        if (!err) {
            err = v.toString();
        }
        v = err;
    }
    return v;
};
