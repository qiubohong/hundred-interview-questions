const queueMicrotask = function (fn) {
    Promise.resolve().then(fn);
}

const StatusType = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
}
/**
 * 手写Promise
 * @author: Qborfy
 */
class MyPromise {

    /**
     * 
     * @param {*} executor 为一个函数，该函数接受两个参数，分别是resolve和reject
     */
    constructor(executor) {
        // 初始化状态为pending
        this.status = StatusType.PENDING;
        // 初始化成功的值
        this.value = undefined;
        // 初始化失败的原因
        this.reason = undefined;
        // 成功的回调函数
        this.onFulfilledCallbacks = [];
        // 失败的回调函数
        this.onRejectedCallbacks = [];

        // 成功的回调函数
        const resolve = (value) => {
            // 状态只能从pending到fulfilled或者rejected
            if (this.status === StatusType.PENDING) {
                this.status = StatusType.FULFILLED;
                this.value = value;
                // 依次执行成功的回调函数 使用queueMicrotask()去执行
                this.onFulfilledCallbacks.forEach(fn => {
                    queueMicrotask(fn(this.value));
                });
            }
        }

        // 失败的回调函数
        const reject = (reason) => {
            // 状态只能从pending到fulfilled或者rejected
            if (this.status === StatusType.PENDING) {
                this.status = StatusType.REJECTED;
                this.reason = reason;
                // 依次执行失败的回调函数 使用queueMicrotask()去执行
                this.onRejectedCallbacks.forEach(fn => {
                    queueMicrotask(fn(this.reason));
                });
            }
        }

        try {
            // 立即执行executor函数
            executor(resolve, reject);
        } catch (e) {
            // 如果执行executor函数出错，直接执行reject
            reject(e);
        }
    }

    /**
     * 将then方法返回的promise的resolve和reject传入
     * @param {*} onFulfilled 
     * @param {*} onRejected 
     */
    then(onFulfilled, onRejected) {
        // onFulfilled和onRejected都是可选参数
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };
        // 判断结果是否为promise，如果是promise，直接返回该promise，如果不是则返回一个新的promise
        function resolvePromise(result, resolve, reject) {
            if (result instanceof MyPromise) {
                result.then(resolve, reject);
            } else {
                resolve(result);
            }
        }
        const newPromise = new MyPromise((resolve, reject) => {
            // 如果状态完成，直接执行onFulfilled
            if (this.status === StatusType.FULFILLED) {
                const result = onFulfilled(this.value);
                resolvePromise(result, resolve, reject);
            }
            // 如果状态失败，直接执行onRejected
            if (this.status === StatusType.REJECTED) {
                const result = onRejected(this.reason);
                resolvePromise(result, resolve, reject);
            }

            // 如果状态为pending，将onFulfilled和onRejected存入对应的回调函数数组中
            if (this.status === StatusType.PENDING) {
                // 同时将resolve和reject传入对应函数中
                this.onFulfilledCallbacks.push((value) => {
                    const result = onFulfilled(value)
                    resolvePromise(result, resolve, reject)
                });
                this.onRejectedCallbacks.push(() => {
                    const result = onRejected(reason)
                    resolvePromise(result, resolve, reject)
                })
            }
        })

        return newPromise;
    }


    /**
     * 执行catch方法，返回一个新的promise
     * @param {*} onRejected 
     */
    catch(onRejected) {
        return this.then(null, onRejected);
    }

    /**
     * 不管是成功还是失败，最终会执行finally方法，返回一个原来promise的结果
     * @param {*} onFinally 
     * @returns 
     */
    finally(onFinally) {
        // 这里要将原来的value或reason返回
        return this.then((value) => {
            onFinally()
            return value;
        }, (reason) => {
            onFinally()
            return reason;
        })
    }

    /**
     * 构造一个成功的promise
     * @param {*} value 
     * @returns 
     */
    static resolve(value) {
        // 判断value是否有then方法，如果有则执行then方法 如果then执行结果是否正常，如果正常则执行resolve，如果不正常则执行reject
        return new MyPromise((resolve, reject) => {
            if (value && value.then && typeof value.then === 'function') {
                value.then(resolve, reject);
            }
            resolve(value)
        })
    }

    /**
     * 构造一个失败的promise
     * @param {*} reason 
     * @returns 
     */
    static reject(reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason)
        })
    }

    /**
     * 执行所有的promise，只要有一个失败，就直接执行reject，如果全部成功，就执行resolve
     * @param {*} promises 
     * @returns 
     */
    static all(promises) {
        // 判断promises是否为可迭代对象
        if (!MyPromise.isIterable(promises)) {
            throw new TypeError('promises is not iterable')
        }
        promises = Array.from(promises)
        return new MyPromise((resolve, reject) => {
            let result = []
            let count = 0
            // 依次执行promises中的promise
            for (let i = 0; i < promises.length; i++) {
                let tempPromise = promises[i];
                // 如果promises中的promise是一个普通值，直接将其放入result中
                if (!(tempPromise instanceof MyPromise)) {
                    result[i] = tempPromise
                    count++
                    // 当所有的promise都执行完毕，执行resolve
                    if (count === promises.length) {
                        resolve(result)
                    }
                } else {
                    promises[i].then(res => {
                        result[i] = res
                        count++
                        // 当所有的promise都执行完毕，执行resolve
                        if (count === promises.length) {
                            resolve(result)
                        }
                    }, err => {
                        // 只要有一个失败，就直接执行reject
                        reject(err)
                    })
                }

            }
        })
    }

    /**
     * 执行所有的promise，不管是成功还是失败，都会执行resolve
     * @param {*} promises 
     * @returns 
     */
    static allSettled(promises) {
        // 判断promises是否为可迭代对象
        if (!MyPromise.isIterable(promises)) {
            throw new TypeError('promises is not iterable')
        }
        promises = Array.from(promises)
        return new MyPromise((resolve, reject) => {
            let result = []
            let count = 0
            // 依次执行promises中的promise
            for (let i = 0; i < promises.length; i++) {
                if(!(promises[i] instanceof MyPromise)) {
                    result[i] = {
                        status: StatusType.FULFILLED,
                        value: promises[i]
                    }
                    count++
                    // 当所有的promise都执行完毕，执行resolve
                    if (count === promises.length) {
                        resolve(result)
                    }
                    continue
                }
                promises[i].then(res => {
                    // 将每个promise的结果存入result中
                    result[i] = {
                        status: StatusType.FULFILLED,
                        value: res
                    }
                    count++
                    // 当所有的promise都执行完毕，执行resolve
                    if (count === promises.length) {
                        resolve(result)
                    }
                }, err => {
                    result[i] = {
                        status: StatusType.REJECTED,
                        reason: err
                    }
                    count++
                    // 当所有的promise都执行完毕，执行resolve
                    if (count === promises.length) {
                        resolve(result)
                    }
                })
            }
        })
    }

    /**
     * 执行所有的promise，只要有一个成功，就执行resolve，当所有的promise都执行完毕，执行reject
     * @param {*} promises 
     * @returns 
     */
    static any(promises) {
        if (!MyPromise.isIterable(promises)) {
            throw new TypeError('promises is not iterable')
        }
        promises = Array.from(promises)
        return new MyPromise((resolve, reject) => {
            let result = []
            let count = 0
            // 依次执行promises中的promise
            for (let i = 0; i < promises.length; i++) {
                if(!(promises[i] instanceof MyPromise)) {
                    resolve(promises[i])
                    return
                }
                promises[i].then(res => {
                    // 只要有一个成功，就直接执行resolve
                    resolve(res)
                }, err => {
                    result[i] = err
                    count++
                    // 当所有的promise都执行完毕，执行reject
                    if (count === promises.length) {
                        reject(result)
                    }
                })
            }
        })
    }

    /**
     * 执行所有的promise，只要有一个成功或失败，就执行resolve或者reject
     * @param {*} promises 
     * @returns 
     */
    static race(promises) {
        if (!MyPromise.isIterable(promises)) {
            throw new TypeError('promises is not iterable')
        }
        promises = Array.from(promises)
        return new MyPromise((resolve, reject) => {
            // 依次执行promises中的promise
            for (let i = 0; i < promises.length; i++) {
                if(!(promises[i] instanceof MyPromise)) {
                    resolve(promises[i])
                    return
                }
                promises[i].then(res => {
                    // 只要有一个成功，就直接执行resolve
                    resolve(res)
                }, err => {
                    // 只要有一个失败，就直接执行reject
                    reject(err)
                })
            }
        })
    }

    /**
     * 判断是否为可迭代对象
     * @param {*} temps 
     * @returns 
     */
    static isIterable(temps) {
        if (typeof temps[Symbol.iterator] !== 'function') {
            return false;
        }
        return true;
    }
}

; (function () {
    // const p = new MyPromise((resolve, reject) => {
    //     setTimeout(() => {
    //         resolve(1)
    //     }, 1000)
    // }).then((res) => {
    //     console.log('then:', res)
    //     return 2;
    // }).finally(() => {
    //     console.log('finally')
    // }).then(res => {
    //     console.log('then2:', res)
    // }).then(res => {
    //     console.log('then3:', res)
    // })

    MyPromise.resolve(1).then(res => {
        console.log('then4:', res)
    })

    MyPromise.reject(3).catch(err => {
        console.log('catch:', err)
    })

    MyPromise.all([MyPromise.resolve(1), MyPromise.resolve(2)]).then(res => {
        console.log('all:', res)
    })

    MyPromise.all([MyPromise.resolve(1), MyPromise.reject(3),MyPromise.resolve(2)]).then(res => {
        console.log('all:', res)
    }).catch(err => {
        console.log('all err:', err)
    })

    MyPromise.allSettled([MyPromise.resolve(1), MyPromise.reject(3),MyPromise.resolve(2)]).then(res => {
        console.log('allSettled:', res)
    })

    MyPromise.any([MyPromise.resolve(1), MyPromise.reject(3),MyPromise.resolve(2)]).then(res => {
        console.log('any:', res)
    }).catch(err => {
        console.log('any err:', err)
    })

    MyPromise.race([MyPromise.resolve(1), MyPromise.reject(3),MyPromise.resolve(2)]).then(res => {
        console.log('race', res)
    }).catch(err => {
        console.log('race err:', err)
    })
    
})()