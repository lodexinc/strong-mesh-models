var debug = require('debug')('strong-mesh-models:server:delete-old');

module.exports = function deleteOld(ModelClass, callback) {
  var timeWindow = ModelClass.app.get(ModelClass.modelName + '.deleteWindow');

  if (timeWindow) {
    timeWindow = parseInt(timeWindow, 10);
  } else {
    timeWindow = 5 * 60 * 1000; // default to 5 minutes
  }

  var now = new Date().getTime();
  var where = {
    timeStamp: {lt: now - timeWindow},
  };
  debug('Deleting records of %s matching %j', ModelClass.modelName, where);
  ModelClass.destroyAll(where, function(err) {
    callback(err);
  });
};
