const combinations = (xs, k) => {
  const r = [];
  const res = [];

  const run = (level, start) => {
    for (let i = start, len = xs.length - k + level + 1; i < len; i++) {
      res[level] = xs[i];

      if (level < k - 1) {
        run(level + 1, i + 1);
      } else {
        r.push(res.slice());
      }
    }
  };
  run(0, 0);
  return r;
};

const combinations2 = (xs, k) => {
  if( k===1 ){
    return xs.map(x=>[x]);
  }
  
  if( xs.length === 1 ){
    return [xs];
  }
  
  let res = [];
  for( let i=1; i < xs.length; i++ ){
      console.log( "A", xs.slice(i) );
      const y = com1( xs.slice(i), k-i );
      console.log( "y", y );
      const m =  y.map(ys => [xs[0],...ys]);
      res = res.concat( m );
      console.log(res);
  }
  return res;

};

module.exports = combinations;