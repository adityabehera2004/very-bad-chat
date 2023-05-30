const socket = io('/');
//const username = document.getElementById('user-name').value;

socket.on('connect', () => {
   socket.emit('join-room', ROOM_ID);
});

socket.on('redirect-lobby', () => {
   window.location.href = '/';
});

// Get the chat input element
const chatInput = document.getElementById('message-input');
const nameInput = document.getElementById('user-name');
let messageBuffer = [];

// Event listener for Enter key press in the chat input
chatInput.addEventListener('keydown', event => {
   if (event.key === 'Enter') {
      event.preventDefault();
      const message = chatInput.value; // Get the value from the chat input
      const username = nameInput.value; // Get the value from the name input

      // Do something with the message, such as saving it to a variable or sending it to the server
      if (socket.connected) {
         socket.emit('send-message', { username, message }, (success) => {
            if (success) {
               console.log('Message sent successfully.');
            } else {
               console.log('Failed to send message. Message buffering enabled.');
               messageBuffer.push({ username, message });
            }
         });
      } else {
         console.log('Connection not available. Message buffering enabled.');
         messageBuffer.push({ username, message });
      }


      chatInput.value = ''; // Clear the chat input
   }
});

socket.on('message-received', (message) => {
   console.log('message received.')
   updateChatArea(message)
});

function updateChatArea(message) {
   const chatMessages = document.getElementById('chat-messages');
   const messageElement = document.createElement('p');
   messageElement.textContent = `[${message.username}]: ${message.message}`;
   chatMessages.appendChild(messageElement);
   chatMessages.scrollTop = chatMessages.scrollHeight; // Automatically scroll to the bottom of the chat area
}

socket.on('connect_error', () => {
   console.log('Connection error occurred. Message buffering enabled.');
});

socket.on('connect_timeout', () => {
   console.log('Connection timeout occurred. Message buffering enabled.');
});

// Attempt to send any buffered messages when the connection is reestablished
socket.on('reconnect', () => {
   if (messageBuffer.length > 0) {
      console.log('Attempting to send buffered messages.');
      for (const bufferedMessage of messageBuffer) {
         socket.emit('send-message', bufferedMessage, (success) => {
            if (success) {
               console.log('Buffered message sent successfully.');
               const index = messageBuffer.indexOf(bufferedMessage);
               if (index > -1) {
                  messageBuffer.splice(index, 1); // Remove the sent message from the buffer
               }
            } else {
               console.log('Failed to send buffered message.');
            }
         });
      }
   }
});

/*
// Update the number of clients in the room header
function updateNumClients(numClients) {
   const roomHeader = document.getElementById('roomHeader');
   if (roomHeader) {
      roomHeader.innerHTML = `${roomName} - ${numClients} people`;
   }
}

// Listen for 'num-clients-updated' event from the server
socket.on('num-clients-updated', (numClients) => {
   updateNumClients(numClients);
});
*/
