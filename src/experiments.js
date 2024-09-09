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


