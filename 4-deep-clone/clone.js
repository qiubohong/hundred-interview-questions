function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

function isSet(obj) {
    return Object.prototype.toString.call(obj) === '[object Set]'
}

function isMap(obj) {
    return Object.prototype.toString.call(obj) === '[object Map]'
}

function isWeakMap(obj) {
    return Object.prototype.toString.call(obj) === '[object WeakMap]'
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
}

function isRegx(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]'
}

function isDate(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]'
}

function isError(obj) {
    return Object.prototype.toString.call(obj) === '[object Error]'
}

function isArrayBuffer(obj){
    return Object.prototype.toString.call(obj) === '[object ArrayBuffer]'
}
// 判断是否为原型对象 如 a = new A();  a.__proto__ === A.prototype
function isPrototype(obj) {
    const Ctor = obj && obj.constructor;
    const proto = (typeof Ctor === 'function' && Ctor.prototype) || Object.prototype;
    return obj === proto;
}
// 浅拷贝
function shallowClone(obj) {
    // 如果不是对象类型 直接返回
    if(typeof obj !== 'object') {
        return obj;
    }

    if(obj === null) {
        return null;
    }

    if (isArray(obj) || isArrayBuffer(obj)) {
        return  obj.slice();
    }

    if (isObject(obj)) {
        // 区分是内置 Object  还是自定义的类
        if(obj.constructor === Object) {
            return Object.assign({}, obj);
        } else {
            if(isPrototype(obj)) {
                return Object.getPrototypeOf(new obj.constructor());
            }
            // 自定义类新建实例化对象 保留原型链 从而保留原型方法或属性
            const newObj = Object.create(Object.getPrototypeOf(obj));
            // 获取对象的所有属性
            const keys = Object.getOwnPropertyNames(obj);
            keys.forEach(key => {
                newObj[key] = obj[key];
            });
            return newObj;
        }
    }
    // 其他类型可以通过 new + constructor 来实现浅拷贝
    return new obj.constructor(obj);
}

// 深拷贝
function deepClone(obj, map = new WeakMap()) {
    // 如果不是对象类型 直接返回
    if(typeof obj !== 'object') {
        return obj;
    }

    if(obj === null) {
        return null;
    }
    // 如果是 WeakMap 直接抛出异常 因为 WeakMap 无法遍历
    if(isWeakMap(obj)) {
        throw new Error('WeakMap can not be cloned');
    }

    if(isPrototype(obj)) {
        return Object.getPrototypeOf(new obj.constructor());
    }

    // 相互引用的对象会导致死循环
    if(map.has(obj)) {
        return map.get(obj);
    }

    if (isArrayBuffer(obj)) {
        return obj.slice();
    }

    if(isArray(obj)) {
        const newArr = [];
        map.set(obj, newArr);
        obj.forEach(item => {
            newArr.push(deepClone(item, map));
        })
        return newArr;
    }

    if(isSet(obj)) {
        const newSet = new Set();
        map.set(obj, newSet);
        obj.forEach(item => {
            newSet.add(deepClone(item, map));
        })
        return newSet;
    }

    if(isMap(obj)) {
        const newMap = new Map();
        map.set(obj, newMap);
        obj.forEach((value, key) => {
            newMap.set(key, deepClone(value, map));
        })
        return newMap;
    }

    if(isRegx(obj)) {
        const newRegx = new RegExp(obj.source, obj.flags);
        map.set(obj, newRegx);
        return newRegx;
    }

    if(isDate(obj)) {
        const newDate = new Date(obj.getTime());
        map.set(obj, newDate);
        return newDate;
    }

    if(isError(obj)) {
        const newError = new Error(obj.message);
        map.set(obj, newError);
        return newError;
    }


    if (isObject(obj)) {
        // 区分是内置 Object  还是自定义的类
        if(obj.constructor === Object) {
            const newObj = {};
            map.set(obj, newObj);
            // 获取对象的所有属性 包括不可枚举属性
            Reflect.ownKeys(obj).forEach(key => {
                newObj[key] = deepClone(obj[key], map);
            });
            return newObj;
        } else {
            if(isPrototype(obj)) {
                return Object.getPrototypeOf(new obj.constructor());
            }
            // 自定义类新建实例化对象 保留原型链 从而保留原型方法或属性
            const newObj = Object.create(Object.getPrototypeOf(obj));
            map.set(obj, newObj);
            // 获取对象的所有属性
            const keys = Object.getOwnPropertyNames(obj);
            keys.forEach(key => {
                newObj[key] = deepClone(obj[key], map);
            });
            return newObj;
        }
    }
    // 其他类型可以通过 new + constructor 来实现拷贝返回
    return new obj.constructor(obj);
}
