# Caching

Caching is a technique to store and retrieve values from a so called cache.

When to cache: Loading from database or file or if calculating of values is expensive and if it is done often.
It does not make sense to cache values that are not often used or that are cheap to recalculate.
You have to balance these parameters, what in real life is not always easy.

Disadvantages of caching:
    1. You need memory for storing the cached values.
    2. Values in cache may be obsolete.
So you have to consider, if it is necessary to invalidate or update values in cache.

Examples: fibonacci, loading from database, reading from textfile

Here is a simple implementation of a cache as a real one-liner. You should pay attention to the object c, which is part of the closure of simpleCache, so member function add and get have access to this object, in which we store our cached values.

```Javascript
const simpleCache = (c = {}) => ({ add: (key, val) => c[key] = val, get: key => c[key] })
```

Using this cache we can implement a function, that given a function as parameter, returns a new function that uses internally a cache.

```Javascript
const cachedFunction = (f, c = simpleCache()) => (x) => c.get(x) === undefined ? c.add(x, f(x)) : c.get(x)
```

Normally this function is called memoize.

## Fibonacci numbers´

Fibonacci numbers are defined as:

```Javascript
let fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2));
fib(7) // -> 13
fib(8) // -> 21
fib(9) // -> 34
```

In this recursive version, values will be calculated very often.

We can see this if we apply

```Javascript
const logtor = (f, cnt = 0, lev = 0) => (args) => {
  console.log(repeat(">>", lev++) + f.name, 'args:'+args); 
  const res = f(args);
  console.log(repeat("<<", lev--), 'res:', res, '# of calls:', ++cnt );
  return res;
};
```

to our function fib:

```console
fib = logtor(fib)
fib(5)
```

yields the following output

```console
fib args:5
..fib args:4
....fib args:3
......fib args:2
......res: 1 # of calls: 1
......fib args:1
......res: 1 # of calls: 2
....res: 2 # of calls: 3
....fib args:2
....res: 1 # of calls: 4
..res: 3 # of calls: 5
..fib args:3
....fib args:2
....res: 1 # of calls: 6
....fib args:1
....res: 1 # of calls: 7
..res: 2 # of calls: 8
res: 5 # of calls: 9
```

So we generate a cached version of fib, so every value will be calculated only once:

```Javascript
fib = cachedFunction(fib)
```

```console
fib(5)

fib args:5
..fib args:4
....fib args:3
......fib args:2
......res: 1 # of calls: 1
......fib args:1
......res: 1 # of calls: 2
....res: 2 # of calls: 3
..res: 3 # of calls: 4
 res: 5 # of calls: 5
```

Now fib will be called only once for every value.

Our cache function is very simple, a true one-liner!
If we have additional requirements to our cache, as for example automatic expiring of values after a certain time, we can use the following implementation. (Expiring of values of course does not make sense for mathematical functions like fib. Therefore our simpleCache used above is good enough.)

```Javascript
const cache = (ttl = 1, c = {}) => ({ // ttl = time to live in secs - 0 meaning live almost forever 
  add: (key, val) => c[key] = { val, validUntil: Date.now() + (ttl || 3600 * 1000) * 1000 }, // 3600 * 1000 -> 1000 hours -> living almost forever!
  get: key => Date.now() < c[key]?.validUntil ? c[key].val : undefined,
  cleaner: () => c = Object.keys(c).filter(k => c[k].validUntil >= Date.now()).reduce((acc, k) => ({ ...acc, [k]: c[k] }), {})
})
```


To remove expired value regularly, for example ever second, you can do:

```Javascript
const myCache = cache()
setInterval( myCache.cleaner, 1000)
```
