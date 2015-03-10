var request = require('request');
var util = require('util');

module.exports = function(ServiceInstance) {
  function runCommand(req, callback) {
    this.actions.create({
      request: req
    }, function(err, action) {
      if (err) return callback(err);
      if (action.result && action.result.error)
        return callback(Error(action.result.error));

      callback(null, action.result);
    });
  }
  ServiceInstance.prototype.runCommand = runCommand;

  function _simpleCommand(cmd, callback) {
    this.runCommand({cmd: cmd}, callback);
  }
  ServiceInstance.prototype._simpleCommand = _simpleCommand;

  /**
   * Retrieve a summary status of the instance.
   * @param {function} callback Callback function.
   */
  function statusSummary(callback) {
    this.runCommand({cmd: 'status'}, callback);
  }
  ServiceInstance.prototype.statusSummary = statusSummary;

  /**
   * Start the application on the instance.
   *
   * @param {function} callback Callback function.
   */
  function appStart(callback) {
    this._simpleCommand('start', callback);
  }
  ServiceInstance.prototype.appStart = appStart;

  /**
   * Stop the application on the instance.
   *
   * "Soft" stop notify workers they are being disconnected, and give them a
   * grace period for any existing connections to finish. "Hard" stops kill the
   * supervisor and its workers with `SIGTERM`.
   *
   * @param {object} options Options object.
   * @param {boolean} options.soft Soft stop the application.
   * @param {function} callback Callback function.
   */
  function appStop(options, callback) {
    if (options.soft)
      return this._simpleCommand('soft-stop', callback);
    return this._simpleCommand('stop', callback);
  }
  ServiceInstance.prototype.appStop = appStop;

  function downloadProfile(profileId, callback) {
    var Service = ServiceInstance.app.models.ServerService;

    Service.findById(this.serverServiceId, function(err, service) {
      if (err) return callback(err);

      service.profileDatas.findById(profileId, function(err, profile) {
        if (err) return callback(err);
        if (!profile) return callback(Error('Profile ' +
        profileId +
        ' not found'));

        var url = util.format('%s/services/%s/profileDatas/%s/download',
          ServiceInstance.app.get('apiUrl'),
          service.id,
          profile.id);
        var req = request.get(url);

        // using events instead of callback interface to work around an issue
        // where GETing the file over unix domain sockets would return an empty
        // stream
        req.on('response', function(rsp) {
          if (callback) callback(null, rsp);
          callback = null;
        });
        req.on('error', function(err) {
          if (callback) callback(err);
          callback = null;
        });
      });
    });
  }
  ServiceInstance.prototype.downloadProfile = downloadProfile;
};
