// ***********************************************************
// Some other stuff - mostly so called bracket functions
// ***********************************************************

// usage: log(() => callSomeComplicatedFunction(2, 4, 6))
// log(() => sin(2))
const log = (f) => {
  const start = new Date().getTime();
  const res = f();
  const end = new Date().getTime();
  console.log('res:', res, 'time:', end - start);
  return res;
};

const tryAction = (action, finalAction) => {
  try {
    action();
  } catch (e) {
    console.log('tryAction', e);
    throw Error('tryAction' + e);
  } finally {
    if (finalAction) finalAction();
  }
};

const onCCAction = (doc, title, action) => {
  const ccs = toArray(doc.selectContentControlsByTitle(title));
  if (ccs.length === 0) {
    tryAction(action);
  } else
    ccs.forEach((cc) => {
      const keepState = [cc.lockContentControl, cc.lockContent];
      cc.lockContent = cc.lockContentControl = false;
      tryAction(
        () => action(cc),
        () => ([cc.lockContent, cc.lockContentControl] = keepState)
      );
    });
};

const withOutScreenUpdating = (app, action) => {
  const keep = app.screenUpdating;
  app.screenUpdating = false;
  tryAction(action, () => app.screenUpdating = keep);
};

// experimentell not working!!!
const logtor = (f) => {
  let lev = 0;
  const range = (n) => [...Array(n).keys()];
  const blanks = range(100)
    .map(() => ' ')
    .join('');
  const indent = (lev) => blanks.substring(0, lev * 3);

  return function () {
    const start = new Date().getTime();
    console.log(indent(lev++), '>', f.name, 'args=', [].slice.call(arguments, 0).toString());
    const ret = f.apply(this, [].slice.call(arguments, 0));
    const end = new Date().getTime();
    console.log(indent(--lev), '<', f.name, 'ret=', ret, 'time', end - start);
    return ret;
  };
};

const logtorX = (f) => {
  let lev = 0;
  const range = (n) => [...Array(n).keys()];
  const blanks = range(100)
    .map(() => ' ')
    .join('');
  const indent = (lev) => blanks.substring(0, lev * 3);

  return function nf() {
    debugger;
    const start = new Date().getTime();
    console.log(indent(lev++), '>', f.name, 'args=', [].slice.call(arguments, 0).toString());
    const args = [].slice.call(arguments, 0);
    const ret = f(args);

    const end = new Date().getTime();
    console.log(indent(--lev), '<', f.name, 'ret=', ret, 'time', end - start);
    return ret;
  };
};
