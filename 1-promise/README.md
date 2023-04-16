# Promise

<!-- more -->

## 定义

> Promise 对象用于表示一个异步操作的最终完成（或失败）及其结果值。  [MDN Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)

下面有一张图用来显示Promise的基本流程图（源自MDN）：

![](/assets/img/promises.png)

如何快速理解Promise呢？就是必须给出一个最终结果的状态处理机制函数。

可以想象Promise是一个排队买奶茶的操作，当你进入排队中处于pending，轮到你的时候成功买到奶茶则是fulfilled，如果中途你走开了或者轮到你的时候没买奶茶，则是买奶茶失败rejected，最后则是无论如何你都离开奶茶店，这就是finally。

因此Promise的有三种状态：
- 待定（pending）:  初始状态
- 已兑现（fulfilled）: 操作成功完成
- 已拒绝（rejected）：操作失败

同时Promise在成功执行后完成执行注册在自身的Promise.prototype.then函数，如果失败后会调用Promise.prototype.catch。

**重要知识点：Promise其实是通过微任务队列(Microtasks)[queueMicrotask()](https://developer.mozilla.org/zh-CN/docs/Web/API/queueMicrotask)的去实现的，所以会比setTimeout等定时器任务要优先，这一点在网上很多手写Promise都忘记去实现了。**

## 方法

1. 内置函数，需要实例化对象后才能调用

- 构建函数 `Promise(resolve, reject)` 创建一个Promise对象
- `Promise.prototype.then()` 为 promise 添加被兑现状态的回调函数，其以回调函数的返回值兑现 promise。若回调函数被调用，则兑现其返回值，否则兑现原来的 promise 兑现的值。  
- `Promise.prototype.catch()` 为 promise 添加一个被拒绝状态的回调函数，并返回一个新的 promise，若回调函数被调用，则兑现其返回值，否则兑现原来的 promise 兑现的值。  
- `Promise.prototype.finally()` 为 promise 添加一个回调函数，并返回一个新的 promise，这个promise的值将为原来promise的值。而传入的回调函数将在原 promise 被敲定（无论被兑现还是被拒绝）时被调用，同时需要等待then或catch执行完后才会被执行。

2. 静态函数，可以直接调用的

- `Promise.all(iterable)` 返回一个新的 `Promise` 对象，等到传入所有的 `Promise` 对象都成功，则表示成功，返回值的顺序与传入顺序一致，如果有任意一个 `Promise`则表示失败
- `Promise.allSettled(iterable)` 等到所有 `Promise` 都已敲定（每个 `Promise` 都已兑现或已拒绝），与all不同在于传入每个`Promise`都会被执行一次
- `Promise.any(iterable)` 当其中的任意一个 `Promise` 成功，就返回那个成功的 `Promise` 的值，与all相反
- `Promise.race(iterable)` 无论传入的 `Promise` 是执行成功或失败，都直接返回其结果
- `Promise.resolve(value)` 返回一个状态有value决定的Promise，如果value(带有then(resolve, reject)的对象)，则会执行then方法去判断状态，如果没有则将value直接返回成功调用的值
- `Promise.reject(reason)` 返回一个状态为已拒绝的 Promise 对象，其错误信息为reason

以上就是Promise的全部基础知识点，接下来我们就来实现，同时业界内也有一个[Promise/A+规范](https://promisesaplus.com/)，大家也可以按照其规范去实现自己的Promise。

# 手写代码

在手写代码之前，我们需要明白`Promise`实现的基本原理：

- 发布订阅模式，解决`Promise`的state发生变化后需要触发的事件，如：then 或 catch
- 链式调用，`Promise`所有的方法调后都会返回一个新的`Promise`对象

其中关键代码在`then`函数的实现，主要是返回一个新的`Promise`对象，见代码。

# Promise在开发中遇到的问题

- 并发Promise，用Promise.all，那么如何实现限制并发数呢?
- await去等待Promise的结果，如果是reject结果，如何catch，或者用其他方式避免await的错误？
- Promise的调用时机，即是一个非异步的Promise函数什么时候会被执行，为什么会比setTimeout等定时器优先更高？


# 额外知识点

## 微任务（Microtasks）和任务（tasks）的区别

JavaScript中的`任务`指的是将代码按照下面的标准机制去形成一个个任务，加入到**任务队列**中，去等待被**事件循环**驱动调度。

- 一段代码被直接执行时
- 触发了一个事件，将其回调函数添加到任务队列时
- 执行到一个由 setTimeout() 或 setInterval() 创建的 timeout 或 interval，以致相应的回调函数被添加到任务队列时

而`微任务`则是通过[queueMicrotask()](https://developer.mozilla.org/zh-CN/docs/Web/API/queueMicrotask)加入微任务队列中，在事件循环之前的安全时间执行的（当前事件循环无任何需要执行任务），同时事件循环会持续调用微任务直至队列中没有留存的，即使是在有更多微任务持续被加入的情况下。

