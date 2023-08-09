---
title: 100道前端精品面试题（2）—— throttle与debounce
date: 2023-04-19 22:00:00
tags:
    - 学习总结
    - 前端面试
---

# 背景

100道前端精品面试题第二篇《throttle与debounce》，说一下为什么选这两个，其实大家都有在用，我们先来了解一下两个函数的作用：

- debounce 防抖，用于减少函数触发的频率，在一个delay时间内，如果触发delay时间归零，直到delay时间到才会触发函数
- throttle 节流，用于限制函数触发的频率，每个delay时间间隔，最多只能执行函数一次

选这两个手写的原因其实很简单，就是面试频率高，而且项目实战会经常用到，同时里面还会隐藏一些知识点。

接下来就让我们开始撸代码吧！

手写难度：⭐️⭐️⭐️

<!-- more -->

不想看文案的，可以直接去看完整源码地址：[https://github.com/qiubohong/hundred-interview-questions/tree/main/2-debouce-throttle]

# debounce

很多功能函数只要搞清楚他们的功能设计，基本上你就可以手写出完整的代码。
以[lodash.debounce](https://github.com/lodash/lodash/blob/master/debounce.js)为参考，接下来我们来拆解一下完整的debounce的功能具体有哪些：

- 构造函数 `debounce(func, waitTime, maxWait, leading, trailing)`
    - func (Function): 要防抖的函数。
    - [wait=0] (number): 需要防抖的毫秒。
    - [leading=false] (boolean): 指定调用在防抖开始前。
    - [trailing=true] (boolean): 指定是否在最大等待时间过期后直接调用，简单点的当超过等待时间，则会触发函数
    - [maxWait=wait] (number): 设置最大等待时间过期。
- 取消函数 `debounceReturn.cancel()` ， `debounceReturn`是执行完debounce函数返回的对象
- 状态函数 `debounceReturn.pending()`
- 立即调用函数 `debounceReturn.flush()`

上面是`lodash`给出debounce的完整功能，但是如果是我们仅仅需要简易版本的throttle，应该如何实现呢？

拆解步骤一：实现一个简单版

`debounce()`函数最简单功能就是，希望能在wait时间段禁止重复触发某个事件，第一个简易版如下：

```js
function debounce_easy(func, waitTime){
    // 用于存储定时器
    let timeout;
    // 存储返回结果
    let result;
    return function(){
        let context = this;
        let args = arguments;
        // 如果定时器存在，就清除定时器
        clearTimeout(timeout);
        // 重新设置定时器
        timeout = setTimeout(function(){
            // 执行函数，将当前作用域绑定的this和参数传递过去
            result = func.apply(context, args);
        }, waitTime);
    }
}

// 单元测试
const debounced = debounce_easy(function (value) {
    console.log('debounce_easy:', value)
    ++callCount;
    return value;
}, 32);
// 这里等同于快速触发4次，只有最后一次生效 输出 debounce_easy: d
const results = [debounced('a'), debounced('b'), debounced('c'), debounced('d')];
let lodashResults = [lodashDebouce('a'), lodashDebouce('b'), lodashDebouce('c'), lodashDebouce('d')];

// callCount: 0
console.log('callCount:', callCount)
setTimeout(function () {
    // callCount: 1
    console.log('callCount:', callCount)
}, 160);
```

拆解步骤二：leading参数希望可以先执行一次函数，再进行防抖， 具体代码如下：

```js
// 其实就是在定时器之前判断 leading和 timeout定期器是否不为空即可 关键代码如下

// 如果leading为true，就立即执行函数
if (leading) {
    // 如果定时器不存在，就执行函数，从而避免重复执行
    if (!timeout) {
        invokeFunc();
    }
}
```

拆解步骤三：加上cancel等函数实现，这里能实现完基本上手写题就80分了
```js
/**
 * 取消防抖
 */
const cancel = function () {
    clearTimeout(timeout)
    lastArgs = lastThis = timeout = undefined
}
```


拆解步骤四：加上参数 `traling+maxWait` 函数，作用在当超过maxWait等待时间后，函数会

重点在于判断是否过了等待时间，所以需要记录每次执行的时间，当超过的时候判断是否有传参数`traling+maxWait`

实现步骤如下流程所示：

{% diagramsnet "/assets/drawio/debounce.drawio" %}

参数解释：
- lastArgs,  // 上一次调用时的参数
- lastThis,  // 上一次调用时的this
- result,  // 上一次调用的返回值
- lastCallTime,  // 上一次调用的时间
- lastInvokeTime = 0,  // 上一次执行的时间
- leading = false,  // 是否立即执行
- maxing = false,  // 是否有最大等待时间
- trailing = true; // 是否在最后一次调用后执行

# throttle

`throttle`节流函数定义：就是无论频率多快，每过一段时间就执行一次。

在实现逻辑上其实是可以看做`debounce`的一种升级版，只需要保证debounce函数在超时后执行一次函数即可

只要针对debouonce函数设置一下参数即可，代码如下：

```js
function throttle(func, wait, leading = true){
    return debounce(func, wait, {
        leading,
        trailing: true,
        'maxWait': wait // 超时时间和控制时间一致就可以了
    })
}
```

当然我们也可以实现一个快速简单版，代码如下：

```js
function throttle_eazy(func, wait) {
    let timer = null;
    let lastInvokeTime = 0;
    return function () {
        const context = this;
        const args = arguments;

        function invokeFunc() {
            func.apply(context, args);
            lastInvokeTime = Date.now();
            timer = null;
        }
        wait = +wait || 0;
        // 计算剩余时间
        let remainTime = wait;
        // 如果上次执行时间大于0，说明已经执行过了，计算剩余时间
        if(lastInvokeTime > 0){
            remainTime = wait - (Date.now() - lastInvokeTime);
        }
        // 如果剩余时间小于等于0，说明可以执行了，重置上次执行时间
        if (remainTime <= 0) {
            invokeFunc();
            return;
        }
        // 如果已经开始计时，说明已经有定时器了，直接返回
        if (timer) {
            return;
        }
        // 否则，开始计时
        timer = setTimeout(() => {
            invokeFunc();
        }, remainTime);
    }
}
// 单元测试
; (function () {
    let count = 0;
    const throttled = throttle(() => {
        count++;
        console.log('hello', count);
    }, 200);
    for (let i = 1; i <= 20; i++) {
        setTimeout(() => {
            console.log('触发i~', i * 100)
            throttled();
        }, 100 * i);
    }
    setTimeout(() => {
        // 正确输出10
        console.log(count);
    }, 2200);
})()
```


# 额外知识点

## TDD开发模式

一般写这些工具函数，都需要提前想好单元测试怎么写，这就是涉及一种开发模式[测试驱动开发（TDD）](https://juejin.cn/post/6844903780970921991)，主要遵循以下两个原则：

- 仅在自动测试失败时才编写新代码。
- 消除重复设计（去除不必要的依赖关系），优化设计结构（逐渐使代码一般化）。


TDD的研发流程如下：

{% diagramsnet "/assets/drawio/tdd.drawio" %}

## lodash的缺陷

如果你正在使用lodash，你应该关注一下，因为lodash的github最后一次更新2021年4月24号，到目前为止已经有两年的时间没有更新，已经堆积很多issues，从上面解读源码的时候就发现一个`lodash.throttle`的一个bug，如下：

```js
const changeInput = throttle((value: string)=>{
  console.log(value);
}, 1000, {
  leading: false,
  trailing: false,
})
// 上述防抖函数将不会按照我们所设想的每隔1秒触发，而是会出现各种异常情况，如果触发频率够高可能会执行，如果触发频率低于1秒则不会执行，因为leading和trailing都设置为false，lodash源码没有针对这一情况进行处理，或者不支持trailing参数设置即可
```

同时，lodash还有其他一些缺陷：

- lodash是支持tree shaking，但是这么写`import {throttle} from 'lodash'` 会将整个lodash包都引入， 必须这么写`import throttle from 'lodash/throttle'`才能做到按需加载
- 进入 npm 上的 lodash 包，它被列为 v4.17.21，并且已经 2 年多没有发布了：https://www.npmjs.com/package/lodash

当然作为一个工具库lodash确实可以让我们少写很多代码，但是已经很长时间没有维护的问题还是需要关注的。

# 参考资料

- Lodash源码：[https://github.com/lodash/lodash/](https://github.com/lodash/lodash/)
- [测试驱动开发（TDD）总结——原理篇](https://juejin.cn/post/6844903780970921991)
- [Hacker News——不要再使用的Lodash](https://news.ycombinator.com/item?id=35056136)

