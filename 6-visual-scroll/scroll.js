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