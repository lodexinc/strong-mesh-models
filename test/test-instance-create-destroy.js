// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

var async = require('async');
var test = require('tap').test;
var util = require('util');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var Client = require('../index').Client;

test('Create and destroy instances', function(t) {
  function TestServiceManager() {
    ServiceManager.apply(this, arguments);
  }
  util.inherits(TestServiceManager, ServiceManager);

  function onServiceUpdate(service, isNew, callback) {
    t.equal(service.name, 'My Service', 'create: Service name should match');
    t.equal(service._groups.length, 1, 'create: Service should have 1 group');
    t.equal(service._groups[0].scale, 1, 'create: Group scale should be 1');

    var app = service.constructor.app;
    var ServiceInstance = app.models.ServiceInstance;
    ServiceInstance.create({
      serverServiceId: service.id,
      groupId: service._groups[0].id,
    }, callback);
  }
  TestServiceManager.prototype.onServiceUpdate = onServiceUpdate;

  function onServiceDestroy(service, callback) {
    var app = service.constructor.app;
    var ServiceInstance = app.models.ServiceInstance;
    ServiceInstance.find({serverServiceId: service.id}, function(err, insts) {
      if (err) return callback(err);

      async.each(insts,
        function(instance, callback) {
          ServiceInstance.deleteById(instance.id, callback);
        },
        callback
      );
    });
  }
  TestServiceManager.prototype.onServiceDestroy = onServiceDestroy;

  function onInstanceUpdate(instance, isNew, callback) {
    t.equal(instance.serverServiceId, 1, 'create: Instance service Id is set');
    t.equal(instance.groupId, 1, 'create: Instance group Id is set');
    callback();
  }
  TestServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

  function onInstanceDestroy(instance, callback) {
    t.equal(instance.serverServiceId, 1, 'destroy: Instance service Id is set');
    t.equal(instance.groupId, 1, 'destroy: Instance group Id is set');
    callback();
  }
  TestServiceManager.prototype.onInstanceDestroy = onInstanceDestroy;

  t.plan(13);
  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    t.ok(!err, 'Server should start');

    var client = new Client('http://127.0.0.1:' + port + '/api');
    client.serviceCreate('My Service', 1, function(err, service) {
      t.ok(!err, 'Create service should succeed');
      t.equal(service.name, 'My Service', 'Service name should match');
      t.equal(service._groups.length, 1, 'Service should have 1 group');
      t.equal(service._groups[0].scale, 1, 'Group scale should be 1');

      client.serviceDestroy('My Service', function(err) {
        t.ok(!err, 'Service should be destroyed');
        server.stop();
      });
    });
  });
});
