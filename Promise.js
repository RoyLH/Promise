const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function Promise(executor) {
  const self = this;
  self.state = PENDING;
  self.value = null;
  self.reason = null;
  self.onFulfilledCallbacks = [];
  self.onRejectedCallbacks = [];

  function resolve(value) {
    if (self.state === PENDING) {
      self.state = FULFILLED;
      self.value = value;

      self.onFulfilledCallbacks.forEach((fulfilledCallback) => {
        fulfilledCallback();
      });;
    }
  }

  function reject(reason) {
    if (self.state = PENDING) {
      self.state = REJECTED;
      self.reason = reason;
      
      self.onRejectedCallbacks.forEach((rejectedCallback) => {
        rejectedCallback();
      });
    }
  }

  try {
    executor(resolve, reject);
  } catch (reason) {
    reject(reason);
  }
}

function resolvePromise(promise, x, resolve, reject) {
  const self = this;
  let called = false; // called 防止多次调用

  // 如果 promise 和 x 指向同一对象，说明是循环引用的情况 以 TypeError 为 reason 拒绝执行 promise  
  // 循环引用例子
  // let promise = p.then(()=>{
  //   return promise;//Chaining cycle detected for promise，会报错循环引用。
  // });
  if (promise === x) {
    return reject(new TypeError('循环引用'));
  }
  
  // 判断 x 是否为对象或者函数，
      // 是：判断 x.then 是否是函数
          // 是：则说明x是一个promise， 则使 promise 接受 x 的状态
          // 否：x是对象或者函数，但没有thenable
      // 否：不为对象或者函数，说明x是一个普通值，以x为参数执行 promise（resolve和reject参数携带promise的作用域，方便在x状态变更后去更改promise的状态）
  if ((Object.prototype.toString.call(x) === '[object Object]' || Object.prototype.toString.call(x) === '[object Function]')) {
    // x是对象或者函数，因为typeof null 是 'object'，所以这里要排除null
    try {
      let then = x.then;

      if (typeof then === 'function') { // 说明是thenable函数，符合Promise要求
        then.call(x, (y) => { // 返回值y有可能还是一个Promise，也有可能是一个普通值，所以这里继续递归进行 resolvePromise
          // 别人的Promise的then方法可能设置了getter等，使用called防止多次调用then方法
          if (called) return ;
          called = true;
          resolvePromise(promise, y, resolve, reject);
        }, (reason) => {
          if (called) return;
          called = true;
          reject(reason);
        });
      } else { // x是对象或者函数，但没有thenable，直接返回
        if (called) return ;
        called = true;
        resolve(x);
      }
    } catch (reason) {
      if (called) return;
      called = true;
      reject(reason);
    } 
  } else { // x是普通值，直接返回
    resolve(x);
  }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => { return value; };
  onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

  const self = this;
  let promise = null;

  // then的返回值也应该是一个promise
  promise = new Promise((resolve, reject) => {
    if (self.state === PENDING) {
      // console.log('PENDING');
      self.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          // 所有的回调函数的执行 都要放在 try catch 中，因为使用者的回掉函数可能出错
          try {
            const x = onFulfilled(self.value);
            resolvePromise(promise, x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        }, 0);
      });
      self.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            const x = onRejected(self.reason);
            resolvePromise(promise, x, resolve, reject);
          } catch(reason) {
            reject(reason);
          }
        }, 0);
      })
    } else if (self.state === FULFILLED) {
      // console.log('FULFILLED');
      setTimeout(() => {
        try {
          const x = onFulfilled(self.value);
          resolvePromise(promise, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      }, 0);
    } else if (self.state === REJECTED) {
      // console.log('REJECTED');
      setTimeout(() => {
        try {
          const x = onRejected(self.reason);
          resolvePromise(promise, x, resolve, reject);
        } catch (reason) {
          console.log('err');
          reject(reason);
        }
      }, 0);
    }
  });

  return promise;
};

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.finally = function (fn) {
  return this.then((value) => {
    fn();
    return value;
  }, (reason) => {
    fn();
    throw reason;
  });
};

Promise.prototype.done = function () {
  return this.catch((reason) => {
    throw reason;
  });
};

Promise.all = function (promises) {
  return new Promise((resolve, reject) => {
    const result = [];

    promises.forEach((promise, index) => {
      promise.then((value) => {
        result[index] = value;

        if (result.length === promises.length) {
          resolve(result);
        }
      }, reject);
    });
  });
};

Promise.race = function (promises) {
  return new Promise((resolve, reject) => {
    promises.forEach((promise, index) => {
      promise.then((value) => {
        resolve(value);
      }, reject);
    });
  });
};

Promise.resolve = function (value) {
  let promise;

  promise = new Promise((resolve, reject) => {
    resolvePromise(promise, value, resolve, reject);
  });

  return promise;
};

Promise.reject = function (reason) {
  return new Promise((resolve, reject) => {
    reject(reason);
  });
};

Promise.defer = Promise.deferred = function () {
  const dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

module.exports = Promise;
