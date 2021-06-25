'use strict';

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

const isFunction = function (target) {
  return target && typeof target === 'function';
};

const isObject = function (target) {
  return target && typeof target === 'object';
};

class Promise {
  constructor (executor) {
    if (!this || this.constructor !== Promise) {
      throw new TypeError('Promise must be called with new');
    }

    if (!isFunction(executor)) {
      throw new TypeError(`Promise constructor's argument must be a function`);
    }

    this.state = PENDING;
    this.value = null;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = value => {
      resolutionProcedure(this, value);
    };
  
    const reject = error => {
      if (this.state === PENDING) {
        this.state = REJECTED;
        this.value = error;
  
        this.onRejectedCallbacks.forEach(callback => callback());
      }
    };

    const resolutionProcedure1 = (promise, target) => {
      if (promise === target) return reject(new TypeError('Promise can not resolved with it self')); // 循环引用

      if (target instanceof Promise) return target.then(resolve, reject);

      if (isObject(target) || isFunction(target)) {
        let called = false;
        try {
          let then = target.then;

          if (isFunction(then)) {
            then.call(
              target,
              value => {
                if (called) return;
                called = true;
                resolutionProcedure(promise, value);
              },
              error => {
                if (called) return;
                called = true;
                reject(error);
              }
            );
            return;
          }
        } catch (error) {
          if (called) return;
          called = true;
          reject(error);
        }
      }

      if (promise.state === PENDING) {
        promise.state = FULFILLED;
        promise.value = target;

        promise.onFulfilledCallbacks.forEach((callback) => callback());
      }
    };

    const resolutionProcedure = (promise, target) => {
      if (promise === target) return reject(new TypeError('Promise can not resolved with it self')); // 循环引用

      if (target instanceof Promise) return target.then(resolve, reject);
    
      if (isObject(target) || isFunction(target)) {
        let called = false;

        try {
          let then = target.then;
    
          if (isFunction(then)) {
            then.call(
              target, 
              value => {
                if (called) return;
                called = true;
                resolutionProcedure(promise, value);
              },
              error => {
                if (called) return;
                called = true;
                reject(error);
              }
            );
            return;
          }
        } catch (error) {
          if (called) return;
          called = true;
          reject(error);
        }
        
      }

      if (promise.state === PENDING) {
        promise.state = FULFILLED;
        promise.value = target;
        
        promise.onFulfilledCallbacks.forEach(callback => callback());
      }
    };
  
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };
  
    const newPromise = new Promise((resolve, reject) => {
      const wrapOnFulfilledCallback = () => {
        setTimeout(() => {
          try {
            resolve(onFulfilled(this.value));
          } catch (error) {
            reject(error);
          }
        }, 0);
      };

      const wrapOnRejectedCallback = () => {
        setTimeout(() => {
          try {
            resolve(onRejected(this.value));
          } catch (error) {
            reject(error);
          }
        }, 0);
      };

      if (this.state === PENDING) {
        this.onFulfilledCallbacks.push(wrapOnFulfilledCallback);
        this.onRejectedCallbacks.push(wrapOnRejectedCallback);
      } else if (this.state === FULFILLED) {
        wrapOnFulfilledCallback();
      } else if (this.state === REJECTED) {
        wrapOnRejectedCallback();
      }
    });

    return newPromise;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
    
  finally(callback) {
    return this.then(
      value => {
        callback();
        return value;
      },
      error => {
        callback();
        throw error;
      }
    );
  }

  done() {
    return this.catch(error => {
      throw error;
    });
  }
  
  static resolve(value) {
    return value instanceof Promise
      ? value
      : new Promise(resolve => resolve(value));
  }
  
  static reject(reason) {
    return new Promise((resolve, reject) => reject(reason));
  }

  static race(promises) {
    return new Promise ((resolve, reject) => {
      promises.forEach(promise => Promise.resolve(promise).then(resolve, reject));
    });
  }
  
  static all(promises) {
    return new Promise((resolve, reject) => {
      let result = [];
      let resolveCount = 0;
      const len = promises.length;
      if (!len) {
        resolve([]);
      }

      for (let index = 0; index < len; index++) {
        Promise.resolve(promises[index]).then(
          (data) => {
            result[index] = data;
            if (++resolveCount === len) {
              resolve(result);
            }
          },
          (error) => {
            reject(error);
          }
        );
      }
    });
  }
  
  static allSettled(promises) {
    return new Promsie((resolve, reject) => {
      let result = [];
      let resolveCount = 0;
      const len = promises.length;
      if (!len) {
        resolve([]);
      }

      for (let index = 0; index < len; index++) {
        Promsie.resolve(promises[index]).then(
          data => {
            result[index] = {
              status: FULFILLED,
              value: data,
            };
            if (++resolveCount === len) {
              resolve(result);
            }
          },
          error => {
            result[index] = {
              status: REJECTED,
              value: error,
            };
            if (++resolveCount === len) {
              resolve(result);
            }
          }
        );
      }
    });
  }

  static defer() {
    const dfd = {};
  
    dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    
    return dfd;
  }

  static deferred() {
    const dfd = {};
  
    dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    
    return dfd;
  }
}

module.exports = Promise;
