var gcm = require('node-gcm');
var db = require('./db');

exports.GCM = {
  sendPush: function(devices, extraParams, cb) {
    var sender = new gcm.Sender(process.env.GCM_KEY);

    sender.send(buildNotification(extraParams, extraParams.ts, extraParams.sm), {
      registrationTokens: devices
    }, function(err, response) {
      if(err) {
        return cb(err);
      }

      return cb(null, response);
    });
  }

}

function buildNotification(extraParams, title, body) {
  return new gcm.Message({
    collapseKey: 'demo',
    priority: 'high',
    contentAvailable: true,
    delayWhileIdle: true,
    timeToLive: 3,
    data: extraParams,
    notification: {
        title: title,
        body: body
    }
  });
}
