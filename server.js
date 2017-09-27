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

// Return if the word "weather" is in the message
function askingWeather(msg) {
  return msg.match(/weather/i);
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
      // Retrieve just the weather state (e.g. "cloudy")
      callback(data.consolidated_weather[0].weather_state_name, 
               data.consolidated_weather[0].min_temp,
               data.consolidated_weather[0].max_temp);
    }
  })
}

// server receiving messages from all connected clients upon connection
io.on('connection', function (socket) {
  console.log('New user connected.');
  io.clients( (error, clients) => {
    if (error) throw error;
    console.log('Number of users connected: ' + clients.length);
  })

  // populate new user's message history
  for (var i=0; i < history.length; i++) {
    socket.emit('message', history[i]);
  }
  
  // upon receiving any message, rebroadcast to all clients
  socket.on('message', function (msg) {
    console.log('Received Message: ', msg);
    console.log('Is this question asking for the time?', askingTime(msg));
    console.log('Is this question asking for the weather?', askingWeather(msg));
    console.log('Is this message a question?', isQuestion(msg));
    history.push(msg);

    // Question siphoning
    if (askingTime(msg)) {
      io.emit('message', msg);
      registerBotMsg("Bot: " + new Date);
    } else if (askingWeather(msg)) {
      getWeather( function(weather, min_temp, max_temp) {
        io.emit('message', msg);
        registerBotMsg("Today's forecast is " + weather + " with a high of " + Math.round(max_temp) + " and a low of " + Math.round(min_temp) + ".");
      })
    } else if (!isQuestion(msg)) {
      io.emit('message', msg);
    } else {
      io.emit('message', msg);
      // registerBotMsg("Bot: Sorry, I don't know the answer to that.");
    }
  });

  // Clear message history upon empty chatroom.
  socket.on('disconnect', (reason) => {
    console.log('Disconnected.');
    console.log('Number of users connected: ' + io.engine.clientsCount);
    if (io.engine.clientsCount == 0) {
      history = [];
      console.log('History cleared.');
    }
  })
});

server.listen(8080, function() {
  console.log('Chat server running');
});