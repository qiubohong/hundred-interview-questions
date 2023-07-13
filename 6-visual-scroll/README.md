---
title: 前端面试100道手写题（6）—— 虚拟滚动
date: 2023-07-05 22:00:00
tags:
    - 学习总结
    - 前端面试
---

# 前言

虚拟滚动在前端中是一个很常见的解决方案，由于浏览器对于内存的限制，当页面需要展示大量 DOM 节点（如：列表数据超过 10 万）的时候，如果完整渲染整个 DOM 树，当页面数据需要更新重新渲染的时候就会出现滚动卡顿，这个时候就需要虚拟滚动去模拟浏览器原生滚动事件，从而避免这个卡顿情况。

手写难度：⭐️⭐️⭐️

涉及知识点：

- 滚动监听事件 wheel/move
- 事件节流
- 滚动偏移量 offset
- 按需渲染计算方案

<!-- more -->

# 虚拟滚动

## 实现方案

- 步骤 1： 监听虚拟滚动容器的 `wheel`或`touchmove` 事件
- 步骤 2： 创造子容器用于填充父容器，使得父容器可以滚动
- 步骤 3： 提供一个渲染子元素 item函数，返回 dom 节点
- 步骤 4： 计算每个元素的高度，然后计算出总共应该渲染多少个子元素 item
- 步骤 5： 当发生滚动事件的时候，更新子容器的偏移高度，然后触发 步骤 4

## 抽象方案

定义一个类`Scroll`，接收参数为：

- `el` 列表容器 DOM 节点
- `list` 列表数据
- `itemRender` 子元素渲染函数
- `itemHeight` 子元素高度

使用例子为：

```js
const scroll = new Scroll({
    el: document.getElementById('scroll'),
    list: [],
    itemRender: (item)=>{
        let child = document.createElement('div');
        child.innerText = `第${item}个div`;
        return child;
    }
});

```

同时需要支持以下函数:

- `update` 列表数组更新， 触发重新渲染

虚拟滚动列表执行步骤：

1. 构造函数初始化，如：`start` `end` 代表位置
2. `bindEvents` 监听滚动事件，触发后续渲染`render`
3. `init` 初始化一个内置容器，用来放置子元素，从而不影响父容器的高度，使得父容器可以滚动
4. `render`计算容器滚动高度和元素 item 渲染高度，判断应该渲染哪部分元素 item


简易版源码实现：
```js
class Scroll {
    constructor({ el, list, itemRender, itemHeight = 30 }) {
        this.$list = el; // 列表容器
        this.list = list;
        this.itemRender = itemRender;
        this.itemHeight = itemHeight;
        this.start = 0;
        this.end = 0;
        this.bindEvents();
        this.init();
    }

    init() {
        // 创建一个子容器，用于渲染列表项
        const childContainer = document.createElement('div');
        childContainer.style.position = 'relative';
        childContainer.style.width = '100%';
        childContainer.style.boxSizing = 'border-box';
        childContainer.style.paddingTop = '0px';
        childContainer.style.overflow = 'hidden';
        childContainer.style.height = `${this.list.length * this.itemHeight}px`;
        this.$list.appendChild(childContainer);
        this.$child = childContainer;
        this.render();
    }

    bindEvents() {
        let y = 0;
        const updateOffset = (e) => {
            this.render();
        }
        this.$list.addEventListener('scroll', updateOffset);
    }

    update() {
        this.render();
    }

    render() {
        const { list, itemRender, itemHeight } = this;
        const { scrollTop, clientHeight } = this.$list;
        const start = Math.floor(scrollTop / itemHeight);
        const gap = Math.ceil(clientHeight / itemHeight);
        console.log('start', start)
        if (start < 0) {
            return;
        }
        let end = start + gap * 2;
        if (start === this.start && end === this.end) {
            return;
        }
        if (end > list.length) {
            end = list.length;
        }
        // 更新子容器的高度和偏移量
        this.$child.style.height = `${this.list.length * this.itemHeight}px`;
        this.$child.style.paddingTop = `${start * itemHeight}px`;

        this.start = start;
        this.end = end;

        const fragment = document.createDocumentFragment();

        for (let i = start; i < end; i++) {
            const item = list[i];
            const $item = itemRender(item);
            $item.style.height = `${itemHeight}px`;
            fragment.appendChild($item);
        }
        this.$child.innerHTML = '';
        this.$child.appendChild(fragment);
    }
}

```

这样子看起来虚拟滚动是不是十分简单，但是其实有些功能还需要优化，具体如下：

- 节流触发滚动函数，避免每次滚动都进行更新
- 列表缓存，减少列表渲染样式更新
- 提前进行更新渲染，减少因为滚动导致的更新等等

完整代码我放到 github 上，大家感兴趣可以去看看[Github Router完整实现](https://github.com/qiubohong/hundred-interview-questions/blob/main/6-visual-scroll)

[Demo体验可以看这里](https://qborfy.com/code/face/visualscroll/index.html)

# 参考资料

- [《新手也能看懂的虚拟滚动实现方法》](https://juejin.cn/post/6844904183582162957)