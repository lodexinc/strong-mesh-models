var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test start command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'start'}, 'Request should match');
        callback(null, {message: 'starting...'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start API', function(tt) {
      service.start(function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message, 'starting...',
          'response should match');
        tt.end();
      });
    });

    t.test('Start CLI', function(tt) {
      exec.resetHome();
      exec(port, 'start 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        var patt = /Service.+service 1.+starting/;
        tt.match(stdout, patt, 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'start'}, 'Request should match');
        callback(Error('application running, so cannot be started'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start API (failure case)', function(tt) {
      service.start(function(err, responses) {
        tt.ifError(err);
        tt.ok(responses[0].error, 'call should error');
        tt.end();
      });
    });

    t.test('Start CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'start 1', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "start" on "\S+" failed with error/;
        tt.match(stderr.toString(), patt, 'Rendered error should match');
        tt.end();
      });
    });
  });
});
