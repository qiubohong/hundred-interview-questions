---
title: 100道前端精品面试题（7）—— 循环轮播图
date: 2023-07-31 22:00:00
tags:
    - 学习总结
    - 前端面试
---

> 做一个有温度和有干货的技术分享作者 —— [Qborfy](https://qborfy.com)

# 前言

循环轮播图，基本上大家用的都是现有组件，如果要让你自己设计实现一个，其实最主要的两个点：循环算法和滚动动画

手写难度：⭐️⭐️

涉及知识点：

- 循环播放的思路
- CSS 动画，transtion和 transform
- Web Component 自定义组件

<!-- more -->

# 轮播图

大家最常用的轮播图基本上就是 [swiper.js](https://github.com/nolimits4web/swiper)，不仅适配 PC 端和移动端，同时包含多种实际应用场景。但是目前我们只需要实现其中一种场景即可——循环轮播图，大概示例图如下：

```html
<swiper-container speed="500" loop="true">
  <swiper-slide>Slide 1</swiper-slide>
  <swiper-slide>Slide 2</swiper-slide>
  <swiper-slide>Slide 3</swiper-slide>
  ...
</swiper-container>
```
<script src="/code/swiper/swiper.js"></script>
<swiper-container slides-per-view="3" speed="500" loop="true">
    <swiper-slide>Slide 1</swiper-slide>
    <swiper-slide>Slide 2</swiper-slide>
    <swiper-slide>Slide 3</swiper-slide>
    <swiper-slide>Slide 4</swiper-slide>
    <swiper-slide>Slide 5</swiper-slide>
    <swiper-slide>Slide 6</swiper-slide>
</swiper-container>


大概效果如下：
![](/assets/img/7-loop-pic-0.gif)

## 实现思路
在研究实现思路前，我们先确定一下要实现的目标，如下：

1. 采用`Web Component`去实现两个自定义标签`<swiper-container>` `<swiper-slide>`
2. `<swiper-container>`标签支持属性配置，如：`speed` `loop`

实现思路如下：

- `<swiper-container>`容器为 flex 容器，里面包含一个`wrapper`容器用于装载所有的`<swiper-slide>`
- `<swiper-slide>` 采用横向布局，当切换下一个的时候，使用`transform:translate(x,y)`将`wrapper`向左移动进行展示下一个`slide`
- 当`loop`为 true的时候，支持循环播放
  - 循环播放逻辑为，在最后一个`<swiper-slide>`后面复制第一个`<swiper-slide>`
  - 当最后一个继续点击next的时候，会把复制第一个展示
  - 当第一个（复制）展示后，点击下一步的时候，取消动画效果，将`wrapper`位置移动到第一个
  - 然后利用`setTimeout(0)`延时执行，增加动画动画效果，将`wrapper`位置移动到第二个

为了更好理解循环动画思路，为了更好的展示效果，我将`container`取消了`overflow:hidden`，具体动画如下：

![](/assets/img/7-loop-pic.gif)

整个轮播图的 DOM 结构如下：
{% diagramsnet "/assets/drawio/loop-pic.drawio" %}

## 代码实践

我们将通过`Web Component`规范去定义上述两个组件，分别是`<swiper-container>`和`<swiper-slide>`

### Swiper-Container组件

`Swiper-Container` 负责实现容器和控制轮播图滚动事件，等于是整个轮播图的核心，具体代码划分如下：

```html
<template id="swiper-container">
<style>
  /**为节省文字，忽略样式，可以到 Github去看看开源完整示例代码 */
</style>
<div class="swiper-container">
    <div class="swiper-container-wrapper">
        <slot></slot>
    </div>
    <div class="swiper-pagination">
    </div>
    <div class="swiper-button-next"></div>
    <div class="swiper-button-prev"></div>
</div>
</template>
<script>
class SwiperContainer extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById('swiper-container');
        const templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));

        this.loop = this.getAttribute('loop') === 'true';
        this.speed = this.getAttribute('speed') || 500;
        this.currentIndex = 0;
    }
    /**
     * 当 custom element首次被插入文档DOM时，被调用。
     */
    connectedCallback() {
        // 由于 slot 的内容是异步的，所以需要等待 slot 的内容渲染完成后再初始化
        setTimeout(() => {
            this.wrapper = this.shadowRoot.querySelector('.swiper-container-wrapper');
            this.slides = this.querySelectorAll('swiper-slide');
            this.pagination = this.shadowRoot.querySelector('.swiper-pagination');
            this.next = this.shadowRoot.querySelector('.swiper-button-next');
            this.prev = this.shadowRoot.querySelector('.swiper-button-prev');
            this.prev.classList.add('swiper-button-prev-disabled');
            this.slideWidth = this.slides[0].offsetWidth;
            this.slideCount = this.slides.length;
            this.slides.forEach((slide) => {
                slide.style.height = '100%';
            });
            this.init();
        }, 0);
    }

    /**
     * 初始化操作
     */
    init() {
        this.wrapper.style.width = this.slideWidth * this.slideCount + 'px';
        this.wrapper.style.transform = `translate3d(-${this.slideWidth * this.currentIndex}px, 0, 0)`;
        this.wrapper.style.transition = `transform ${this.speed}ms ease-in-out`;
        
        // 判断是否可以循环
        let slideCount = this.slideCount;
        if (this.slideCount > 1 && this.loop) {
            this.cloneFirstSlide();
            slideCount = this.slideCount - 1;
        }
        this.pagination.innerHTML = '';
        const bulletFragment = document.createDocumentFragment();
        for (let i = 0; i < slideCount; i++) {
            const bullet = document.createElement('div');
            bullet.classList.add('swiper-pagination-bullet');
            bullet.dataset.index = i;
            bulletFragment.appendChild(bullet);
        }
        bulletFragment.children[0].classList.add('swiper-pagination-bullet-active');
        this.pagination.appendChild(bulletFragment);
    }

    /**
     * 绑定相关事件
     */
    bindEvents(){
      this.next.addEventListener('click', () => {
            this.nextSlide();
        });
        this.prev.addEventListener('click', () => {
            this.prevSlide();
        });
        this.pagination.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            if (index) {
                this.goToSlide(index);
            }
        });
    }

    /**
     * 将第一个 slider 复制到最后
     */
    cloneFirstSlide() {
        const firstSlide = this.slides[0].cloneNode(true);
        this.wrapper.appendChild(firstSlide);
        this.slideCount++;
    }

    /**
     * 跳转到下一个的 slider
     */
    nextSlide() {
        // 如果不是循环的，且已经是最后一个，就不执行
        if (!this.loop && this.currentIndex >= this.slideCount - 1) {
            return;
        }
        this.currentIndex++;
        // 改变下一个 icon 的状态
        if (!this.loop && this.currentIndex >= this.slideCount - 1) {
            this.next.classList.add('swiper-button-next-disabled');
        } else {
            this.next.classList.remove('swiper-button-next-disabled');
            this.prev.classList.remove('swiper-button-prev-disabled');
        }
        console.log(this.currentIndex, this.slideCount)
        // 判断是不是最后一个 如果最后一个，等动画执行完毕，瞬间跳到第一个
        if (this.currentIndex >= this.slideCount) {
            this.currentIndex = 0;
            this.wrapper.style.transition = 'none';
            this.wrapper.style.transform = `translate3d(-${this.slideWidth * this.currentIndex}px, 0, 0)`;
            setTimeout(() => {
                this.wrapper.style.transition = `transform ${this.speed}ms ease-in-out`;
                this.currentIndex++;
                this.goToSlide(this.currentIndex);
            }, 0);
        } else {
            this.goToSlide(this.currentIndex);
        }
    }

    /**
     * 跳转到上一个的 slider 
     */
    prevSlide() {
        if (!this.loop && this.currentIndex <= 0) {
            return;
        }
        this.currentIndex--;
        if (!this.loop && this.currentIndex <= 0) {
            this.prev.classList.add('swiper-button-prev-disabled');
        } else {
            this.next.classList.remove('swiper-button-next-disabled');
            this.prev.classList.remove('swiper-button-prev-disabled');
        }
        if (this.currentIndex < 0) {
            this.currentIndex = this.slideCount - 1;
        }
        this.goToSlide(this.currentIndex);
    }

    /**
     * 跳转到指定的 slider
     * @param {*} index 
     */
    goToSlide(index) {
        this.currentIndex = index;
        this.wrapper.style.transform = `translate3d(-${this.slideWidth * this.currentIndex}px, 0, 0)`;
        this.setActivePagination();
    }

    /**
     *  设置当前的 pagination
     */
    setActivePagination() {
        const paginationBullets = this.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
        paginationBullets.forEach((bullet, index) => {
            bullet.classList.remove('swiper-pagination-bullet-active');
        });
        if (this.currentIndex === this.slideCount - 1 && this.loop) {
            paginationBullets[0].classList.add('swiper-pagination-bullet-active');
            return;
        }
        paginationBullets.forEach((bullet, index) => {
            if (index === this.currentIndex) {
                bullet.classList.add('swiper-pagination-bullet-active');
            }
        });
    }

}

// 注册swiper-container组件
customElements.define('swiper-container', SwiperContainer);
</script>
```

要是不想看代码，可以看这里的方法简要说明：

- `init` 初始化函数，用了 setTimeout去解决 slot的异步渲染问题，获取一些 dom 节点
  - 其中需要判断是否循环loop，如果需要则需要复制第一个节点到最后`cloneFirstSlide`
- `bindEvents` 绑定 prev、next、pagination等 dom 的  click事件
- `nextSlide` 和 `prevSlide` 指的是跳转到下一个节点和上一个节点所需要执行的函数，
  - 其中  `nextSlide` 函数需要在最后一个节点判断当前是否为 loop，如果 loop为 true，则需要停止动画，同时将 wrapper 容器的 transform 迁移到第一个节点
- `goToSlide` 用执行当前需要展示哪个 slide
- `setActivePagination`用执行判断 哪个  pagination需要展示高亮样式

### Swiper-Slide组件
`swiper-slide`组件实现起来就很简单，只需要满足样式展示即可，不过有一点需要注意，就是由于`swiper-container`是flex布局，所以需要设置`swiper-slide`的样式不允许缩放`flex-shrink: 0;`，完整代码如下：

```js
/**
 * 轮播组件，子元素组件
 */
class SwiperSlide extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        template.innerHTML = `
        <style>
        .swiper-slide {
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            /* 防止缩小 */
            flex-shrink: 0;
            border: 1px solid #000;
            background-color: #478703;
            color: #fff;
            font-size: 24px;
            text-align: center;
        }
        </style>
        <div class="swiper-slide"><slot></slot></div>
        `;
        const templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }
}
// 注册swiper-slide组件
customElements.define('swiper-slide', SwiperSlide);
```

本文所有代码都已放到[100道前端精品面试题](https://github.com/qiubohong/hundred-interview-questions)，中的[前端面试100道手写题（7）—— 循环轮播图](https://github.com/qiubohong/hundred-interview-questions/tree/main/7-loop-pic)，如果有帮助到你，可以帮忙给个star 即可。

# 参考资料

- [Web Component 自定义组件](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components)