---
title: 100道前端精品面试题（4）—— 深浅拷贝
date: 2023-05-15 22:00:00
tags:
    - 学习总结
    - 前端面试
---

# 前言

深浅拷贝经典前端面试题，不仅仅只是实现逻辑，更加是对整个Javascript语言的实现背后一套理论，从基础数据类型到原型链一整套知识体系的熟悉程度，下面我们就从简单到困难一一实现。

手写难度：⭐️⭐️⭐️

涉及知识点：

- 数据类型在内存空间的存储
- 原型以及原型链（这是实现拷贝一个重要知识点，如何拷贝自定义的类实例对象）
  - 如何拷贝一个原型对象 如： `a = {}; clone(a.__proto__)`
- 数组的判断
- 日期/正则等其他内置对象的拷贝
- 函数的拷贝
  
<!-- more -->

# 浅拷贝和深拷贝

## 为什么

凡是遇到问题，多问一次自己为什么？—— 为什么在Javascript中会有【深拷贝】｜ 【浅拷贝】 区分的操作呢？

首先，我们回想一下，一开始我们学习语言的第一件事是什么（Hello World除外），是数据类型，Javascript中数据类型有以下几种：

- 基础数据类型：number, string, boolean等
- 引用数据类型：object, array, date等

然后，就是变量赋值，如： a = 1，b = new Date()，在 JavaScript 中分为两种：

1. 基础数据类型，值都有固定的大小，保存在栈内存中，由系统自动分配存储空间在栈内存空间的值，我们可以直接进行操作，因此基础数据类型都是按照值访问
2. 复杂数据类型，值都保存在堆内存中的对象，引用类型的值都是按引用访问的，所以在操作对象时，实际上是操作对象的引用而不是实际的对象。引用可以理解为保存在栈内存中的一个地址，该地址指向堆内存中的一个实际对象

因此，在复制值的时候，两种类型操作不一样，如下：

1. 基础类型复制，会在栈空间新建一个空间去进行复制
2. 引用类型复制，系统会为新的变量自动分配一个新的栈内存空间这个栈内存空间保存着与被复制变量相同的指针，尽管他们在栈内存中的内存空间的位置互相独立但是在堆内存中访问到的对象实际上是同一个，因此，当我们改变其中一个对象的值时，实际上就是改变原来的对象

简单的总结一下：

1. 基础类型的值长度是固定的，所以可以在栈空间分配存储空间，当进行复制的时候，可以直接在栈空间内新建一个存储空间进行赋值
2. 引用类型的值长度是不固定的，所以需要在栈空间分配一个指针，然后在堆内存空间分配一个对象，将指针指向改对象，当进行复制的时候，需要在栈空间新建一个指针，然后指向之前在堆内存建的对象

了解完为什么后，再去实现浅拷贝和深拷贝就会理所当然了。

## 区别
浅拷贝和深拷贝，在了解完【为什么】后，就很容易理解两者的区别：

- 浅拷贝只会对引用类型的值做第一层堆内存进行拷贝
- 深拷贝除了会复制新建栈空间的值，同时还在将指向堆内存中对象进行新建

那么为什么不都用深拷贝去实现就好了，那是因为在浅拷贝机制可以有效利用存储空间，同时浅拷贝的也存在一定应用场景：

- 当需要统一管理引用值的变化时候，如：当 fetch 一个请求返回 json 数据后，当我们对其做修改调整后，其实不需要做深拷贝的

## 实现

### 浅拷贝

实现原理：只对引用类型数据做第一层值进行拷贝

步骤：

1. 判断数据类型，需要将所有引用类型数据判断一次
2. 根据不同引用类型，将引用类型数据值进行复制新建一次，利用`Object.assign `或 `new +     return new obj.constructor(obj);` 进行复制进行
3. 其中针对自定义类，如：`new A()`，需要通过继承其原型链，利用 `Object.getPrototypeOf`
4. 基础类型直接返回

代码如下：
```js
// 类型判断 主要基于 Object.prototype.toString.call
function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
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
```

### 深拷贝

实现原理： 需要对整个对象的进行深度遍历赋复制新建，从而实现修改新建值不会影响到原有的值

步骤：
1. 数据类型判断和浅拷贝一致
2. 针对不同引用类型需要遍历+递归实现值的拷贝新建


代码如下：
```js
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

```

# 总结

浅拷贝和深拷贝作为前端面试经常会出现的题目，在做这篇题目之前，我对浅拷贝和深拷贝的其实是缺失的，即使网上的答案也只是做了一部分，当我深入阅读`lodash.Clone`和`lodash.deepClone`的源码才发现这里面隐藏的一些知识点，这里做一个阅读前和阅读后：

阅读源码前：

- 浅拷贝只需要通过 Object.assigin就可以实现拷贝，但是从来没想过数据类型判断的重要性，包括自定义类对应实例的拷贝
- 深拷贝只需要解决数组遍历，以及解决循环依赖问题即可，忘记了还有Map/Set等新一代数据类型的遍历

阅读源码后：

- 数据类型判断才是拷贝的重要依据，根据不同类型需要做不同逻辑拷贝，而且 JavaScript 中的数据类型真的有很多，不仅只有 array object，还有常见Date，Regexp，或者冷门的 ArrayBuffer等
- 自定义类的拷贝也很复杂，同时也引出了原型对象(__proto__ prototype)的拷贝，这里也加深我对JavaScript 原型的理解

JavaScript 数据实例拷贝背后的原理，其实是 JavaScript 中不同数据类型存储值的方式需要去做不一样的处理，而引用类型最终在 JavaScript 中的实现就是依赖于原型和原型链去实现的。

# 参考资料

- [lodash baseClone 浅拷贝和深拷贝的基础实现方法](https://github.com/lodash/lodash/blob/master/.internal/baseClone.js#L236)