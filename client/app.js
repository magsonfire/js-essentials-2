var socket = io();

$("button").on('click', function() {
  var text = $("#message").val();
  var who = $("#initials").val();

  // Catch case of empty identity
  if (who < 1) {
    who = "Anonymous";
  }
  
  // socket library creates (emits) an event to the server
  socket.emit('message', who + ": " + text);
  $('#message').val('');
  
  return false;
});

// upon receiving a message event from the server, write to client's view
socket.on('message', function (msg) {
  $('<li>').text(msg).appendTo('#history');
});