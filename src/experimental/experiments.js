const decorateFunction =
  (f, decorator) =>
  (...args) => {
    if (decorator.before && decorator.before()) {
      const res = f(...args)
      decorator.after && decorator.after()
      return res
    }
  }

const counter = (cnt = 0) => ({ before: () => cnt++, cnt: () => cnt })

const fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2))

const runDemo = () => {
  const c = counter()
  const decoratedFib = decorateFunction(fib, c)
  decoratedFib(10)

  const d = counter()
  const decoratedFib2 = decorateFunction(decoratedFib, d)
  decoratedFib2(5)
}

// ***********************************************************
// Some experimental stuff - mostly so-called bracket functions
// ***********************************************************

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




if (typeof module !== 'undefined' && module.exports) module.exports = { decorateFunction, counter, fib, runDemo }
