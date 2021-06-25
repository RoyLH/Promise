'use strict';

const Promise = require('./Promise');

// 测试1 - 同步触发resolve
{
  new Promise((resolve, reject) => {
    resolve(1);
  }).then(
    data => {
      console.log(data); // 1
    },
    error => {
      console.log('error: ', error);
    }
  );
}

// 测试2 - 异步触发resolve
{
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2);
    }, 1000);
  }).then(
    data => {
      console.log(data); // 2
    }, 
    error => {
      console.log('error: ', error);
    }
  );
}

// 测试3 - 注册多个then函数
{
  var promise3 = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(3);
    }, 2000);
  });

  promise3.then(
    data => {
      console.log(data); // 3
      return data + 'c';
    },
     error => {
      console.log('error: ', error);
    }
  );

  promise3.then(
    data => {
      console.log(data); // 3
    }, 
    error => {
      console.log('error: ', error);
    }
  );
}

// 测试4 - executor执行报错
{
  new Promise((resolve, reject) => {
    a.b = 10;
    resolve(4);
  }).then(
    data => {
      console.log(data); // error:  ReferenceError: a is not defined
    }, 
    error => {
      console.log('error: ', error);
    }
  );
}

// 测试5 - 主动执行reject
{
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('5 error');
    }, 1000);
  }).then(
    data => {
      console.log(data);
    },
    error => {
      console.log('error: ', error); // error:  5 error
    }
  );
}

// 测试6 - 链式调用，then函数返回值是一个新Promise
{
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(6);
    }, 3000);
  }).then(
    data => {
      console.log(data); // 6
      return new Promise((resolve, reject) => {
        resolve(new Promise((resolve, reject) => {
          resolve('new 6');
        }));
      })
    }, 
    error => {
      console.log('error: ', error);
    }
  ).then(
    data => {
      console.log('then返回新Promise的数据', data); // then返回新Promise的数据 new 6
    }, 
    error => {
      console.log('then返回新Promise的error', error);
    }
  );
}

// 测试7 - 就算马上调用resolve，Promise也始终是异步调用，微队列micro task，也叫jobs，宏队列macro task，又叫tasks
{
  console.log('执行1');
  var promise7 = new Promise((resolve, reject) => {
    resolve(7);
  });
  promise7.then(
    data => {
      console.log('执行3') // 执行3
      console.log(data); // 7
    }, 
    error => {
      console.log('error: ', error);
    }
  );
  promise7.then(
    data => {
      console.log('执行4') // 执行4
      console.log(data); // 7
    }, 
    error => {
      console.log('error: ', error);
    }
  );
  console.log('执行2')
}

// 测试8 - Promise.all 和 Promise.race
{
  let promise8_1 = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('8-1');
    }, 1000);
  });
  
  let promise8_2 = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('8-2');
    }, 2000);
  });
  
  let promise8_3 = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('8-3');
    }, 3000);
  });

  Promise.all([promise8_1, promise8_2, promise8_3])
  .then(
    data => {
      console.log(data); // [ '8-1', '8-2', '8-3' ]
    }, 
    error => {
      console.log('error: ', error);
    }
  );

  Promise.race([promise8_1, promise8_2, promise8_3])
  .then(
    data => {
      console.log(data); // 8-1
    },
    error => {
      console.log('error: ', error);
    }
  );
}

// 测试9 - Promise穿透
{
  new Promise((resolve, reject) => {
    resolve(9);
  })
  .then()
  .then(
    data => {
      console.log(data); // 9
    }, 
    error => {
      console.log('error: ', error);
    }
  );
}

// 测试10 - catch()
{
  new Promise((resolve, reject) => {
    reject(10);
  }).then(data => {
    console.log(data);
  }).catch(error => {
    // 这里catch其实是一个新的Promise的then
    // 上一个Promise有默认的onRejected函数，做的是 throw reason，所以then返回的Promise就捕获到了错误
    // 执行reject(reason)，然后返回的这个Promise就进入错误处理函数，把第一个Promise的错误reason打印出来
    // 原理就是第一个Promise的错误reason被throw出来，被下一个Promise捕获到
    console.log('error: ', error); // error:  10
  });
}