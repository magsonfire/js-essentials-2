var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app);

app.use(express.static('client'));

var io = require('socket.io')(server);

var history = [];

// Return if message is a question
function isQuestion(msg) {
  return msg.match(/\?$/);
}

// Return if the word "time" is in the message
function askingTime(msg) {
  return msg.match(/time/i);
}

// Send bot's response to history and all clients
function registerBotMsg(msg) {
  history.push(msg);
  io.emit('message', msg);
}

// Return JSON object with local weather information
function getWeather(callback) {
  // This is the "curl" part of the JS function
  var request = require('request');
  request.get("https://www.metaweather.com/api/location/4118/", function (error, response) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(response.body);
      callback(data.consolidated_weather[0].weather_state_name);
    }
  })
}

// server receiving messages from all connected clients upon connection
io.on('connection', function (socket) {
  // populate new user's message history
  for (var i=0; i < history.length; i++) {
    io.emit('message', history[i]);
  }
  
  // upon receiving any message, rebroadcast to all clients
  socket.on('message', function (msg) {
    console.log('Received Message: ', msg);
    console.log('Is this message a question?', isQuestion(msg));
    console.log('Is this question asking for the time?', askingTime(msg));
    history.push(msg);

    // Answer with time if asked
    if (askingTime(msg)) {
      io.emit('message', msg);
      registerBotMsg("Bot: " + new Date);
    } else if (!isQuestion(msg)) {
      io.emit('message', msg);
    } else {
      io.emit('message', msg);
      registerBotMsg("Bot: Sorry, I don't know the answer to that.");
    }
  });

  // #TODO: Clear message history upon empty chatroom.
  // socket.on('disconnect', (reason) => {
  //   console.log('Disconnected.');
  //   // Check if room is empty
  //   console.log(namespace.clients.length);
  // })
});

server.listen(8080, function() {
  console.log('Chat server running');
});