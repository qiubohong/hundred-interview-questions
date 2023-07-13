
// 自定义路由组件
customElements.define('router-view', class extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        template.id = 'router-view';
        template.innerHTML = '<div><slot name="content"></slot></div>';
        const templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }
    // 首次被插入到文档 DOM 节点上时被调用
    connectedCallback() {
        console.log('首次被插入到文档 DOM 节点上时被调用');
    }
    // 当 custom element 从文档 DOM 中删除时，被调用
    disconnectedCallback() {
        console.log('Custom square element removed from page.');
    }
    // 当 custom element 被移动到新的文档时，被调用
    adoptedCallback() {
        console.log('Custom square element moved to new page.');
    }
    // 增加、删除或者修改某个属性时被调用
    attributeChangedCallback(name, oldValue, newValue) {
        console.log('Custom square element attributes changed.');
    }
});

/**
 * 注册路由
 * @param {*} routes  路由列表
 * @param {*} mode    路由模式
 * @returns 
 */
function createRouter(routes, mode = 'history') {
    // 当前路由
    let currentRoute = null
    // 保存路由
    const matcherMap = new Map()
    const nameMap = new Map()
    for (let route of routes) {
        // route 的格式为 {path: '/home', name: 'home', component: Home}
        matcherMap.set(route.path, route)
        nameMap.set(route.name, route)
    }

    // 添加路由
    function addRoutes(routes) {
        for (let route of routes) {
            matcherMap.set(route.name, route)
        }
    }

    // 删除路由
    function removeRoutes(routes) {
        for (let route of routes) {
            matcherMap.delete(route.name)
        }
    }

    // 获取路由
    function getRoutes() {
        return matcherMap
    }

    // 获取路由
    function getRoute(name) {
        return nameMap.get(name)
    }

    // 路由回调
    function callback() {
        const route = match(window.location)
        if (currentRoute && currentRoute.path === route.path) {
            return
        }
        if (!route) {
            // 路由不存在，跳转到首页
            push('/')
            return
        }
        if (route) {
            currentRoute = route
            const component = route.component
            // 渲染组件
            document.querySelector('router-view').innerHTML = `<${component} slot="content"></${component}>`
        }
    }

    // 开始监听路由
    function setupListeners() {
        if (mode === 'history') {
            window.addEventListener('popstate', callback)
        } else if (mode === 'hash') {
            window.addEventListener('hashchange', callback)
        }

        callback()
    }

    // 路由跳转
    function push(name) {
        const route = nameMap.get(name) || matcherMap.get(name)
        console.log(route)
        if (!route) {
            return
        }
        if (mode === 'history') {
            window.history.pushState({}, '', route.path)
        } else if (mode === 'hash') {
            window.location.hash = `#${route.path}`
        }
    }

    // 路由替换
    function replace(location) {
        if (mode === 'history') {
            window.history.replaceState({}, '', location)
        } else if (mode === 'hash') {
            window.location.replace(location)
        }
    }

    // 路由匹配
    function match(location) {
        if (mode === 'history') {
            return matcherMap.get(location.pathname)
        } else if (mode === 'hash') {
            return matcherMap.get(location.hash.slice(1))
        }
    }

    // 销毁路由
    function destroy() {
        if (mode === 'history') {
            window.removeEventListener('popstate', callback)
        } else if (mode === 'hash') {
            window.removeEventListener('hashchange', callback)
        }
    }

    const router = {
        addRoutes,
        removeRoutes,
        getRoutes,
        getRoute,
        push,
        replace,
        destroy,
        currentRoute,
    }

    setupListeners()

    return router
}