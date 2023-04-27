function debounce(func, wait, options){
    let lastArgs,  // 上一次调用时的参数
    lastThis,  // 上一次调用时的this
    result,  // 上一次调用的返回值
    timerId,  // 定时器id
    lastCallTime,  // 上一次调用的时间
    lastInvokeTime = 0,  // 上一次执行的时间
    leading = false,  // 是否立即执行
    maxing = false,  // 是否有最大等待时间
    trailing = true; // 是否在最后一次调用后执行

    if(typeof func !== 'function'){
        throw new TypeError('Expected a function');
    }
    wait = Number(wait) || 0; // 等待时间，如果不是数字，则默认为0
    // 如果options是对象，则将leading、maxing、trailing赋值
    if(Object.prototype.toString.call(options) === '[object Object]'){
        leading = !!options.leading; // !!将options.leading转换为布尔值
        maxing = 'maxWait' in options; // 判断options中是否有maxWait属性
        maxWait = maxing ? Math.max(Number(options.maxWait) || 0, wait) : maxWait; // 最大等待时间 如果maxWait不是数字，则默认为0，然后从maxWait和wait中取最大值
        trailing = 'trailing' in options ? !!options.trailing : trailing; // !!将options.trailing转换为布尔值 默认为true
    }

    // 执行函数 同时将lastInvokeTime赋值
    function invokeFunc(time){
        let args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    // 开始计时
    function startTimer(pendingFunc, wait){
        return setTimeout(pendingFunc, wait);
    }

    // 取消计时
    function cancelTimer(id){
        clearTimeout(id);
    }

    // 判断是否可以执行函数
    function shouldInvoke(time){
        let timeSinceLastCall = time - lastCallTime,  // 距离上一次调用的时间
            timeSinceLastInvoke = time - lastInvokeTime  // 距离上一次执行的时间
        // 如果lastCallTime为undefined，说明是第一次调用 
        // 如果timeSinceLastCall大于等于wait，说明距离上一次调用的时间大于等于wait，说明可以执行函数
        // 如果timeSinceLastCall小于0，说明系统时间被调整过，可以执行函数
        // 如果maxing为true，说明有最大等待时间，如果timeSinceLastInvoke大于等于maxWait，说明距离上一次执行的时间大于等于maxWait，说明可以执行函数
        return (lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || (maxing && timeSinceLastInvoke >= maxWait));
    }

    // 计算剩余等待时间
    function remainingWait(time){
        let timeSinceLastCall = time - lastCallTime,  // 距离上一次调用的时间
            timeSinceLastInvoke = time - lastInvokeTime,  // 距离上一次执行的时间
            timeWaiting = wait - timeSinceLastCall;  // 等待时间
        return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
    }

    // 最后一次调用后执行的函数
    function trailingEdge(time){
        timerId = undefined;
        // 如果trailing为true，说明在最后一次调用后执行
        // 这里判断有问题，如果trailing为false，说明不在最后一次调用后执行，但是还是需要会执行
        if(trailing && lastArgs){
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    // 定时器到期后执行的函数
    function timerExpired(){
        // 为什么要包装一层 timerExpired函数？
        // 因为在leadingEdge函数中，会重新计时，所以这里需要重新获取当前时间
        let time = Date.now();
        // 如果可以执行函数，则执行函数
        if(shouldInvoke(time)){
            return trailingEdge(time);
        }
        // 否则重新计时
        timerId = startTimer(timerExpired, remainingWait(time));
    }

    // 第一次调用或者距离上一次调用的时间大于等于wait时执行的函数
    function leadingEdge(time){
        // 如果leading为true，说明立即执行
        if(leading){
            return invokeFunc(time);
        }
        // 否则重新计时
        lastInvokeTime = time;
        timerId = startTimer(timerExpired, wait);
        return result;
    }

    // 调用debounce函数返回的函数
    function debounced(...args){
        const time = Date.now();
        const isInvoking = shouldInvoke(time);  // 是否可以执行函数
        lastArgs = args;  // 将参数赋值给lastArgs
        lastThis = this;  // 将this赋值给lastThis
        lastCallTime = time;  // 将当前时间赋值给lastCallTime
        // 如果可以执行函数
        if(isInvoking){
            // 如果定时器id不存在，说明是第一次调用或者距离上一次调用的时间大于等于wait
            if(timerId === undefined){
                return leadingEdge(lastCallTime);
            }
            if(maxing){
                // 如果有最大等待时间，将定时器id重新计时
                timerId = startTimer(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        // 如果定时器id不存在，说明是第一次调用或者距离上一次调用的时间大于等于wait
        if(timerId === undefined){
            timerId = startTimer(timerExpired, wait);
        }
        return result;
    }

    // 取消防抖函数
    function cancel() {
        if (timerId !== undefined) {
          cancelTimer(timerId)
        }
        lastInvokeTime = 0
        lastArgs = lastCallTime = lastThis = timerId = undefined
      }

    return debounced;
    
}