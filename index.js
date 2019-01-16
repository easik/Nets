// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
// var io = require('../..')(server);
var io = require('socket.io')(server);
// var port = process.env.PORT || 80;
var port = process.env.PORT || 80;
var fs = require("fs");  // read 'whitelist.txt' file

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// IP

var WHITELIST = fs.readFileSync("./whitelist.txt").toString('utf-8').split('\n').filter(item => item);  // filter to get rid of last empty item in list

var getClientIp = function(req) {
  var ipAddress = req.connection.remoteAddress;
  
  if (!ipAddress) {
    return '';
  }

  // convert from "::ffff:192.0.0.1" to "192.0.0.1"
  if (ipAddress.substr(0, 7) == "::ffff:") {
    ipAddress = ipAddress.substr(7)
  }

  return ipAddress;
}

// Check if IP's white listed

app.use(function(req, res, next) {
  var ipAddress = getClientIp(req);
  if(WHITELIST.indexOf(ipAddress) === -1) {
    // If not in white list then it's blacklisted
    // IP is blacklisted
    res.sendFile(__dirname + "/public/blacklisted.html");
    console.log('Connected ' + ipAddress + ' IP is blacklisted: not found in whitelist.txt for details.');
  } else {
    // IP is NOT blacklisted (whitelisted)
    //console.log(ipAddress + ' IP connected.'); 
    next();
  }
});

// If IP is accepted proceed: Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
