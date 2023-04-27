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