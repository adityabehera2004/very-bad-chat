const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

const rooms = new Map();

app.get('/', (req, res) => {
   const availableRooms = [];
   for (const [roomId, room] of rooms) {
      availableRooms.push({
         id: roomId,
         roomName: room.roomName,
         numClients: room.clients.size,
      });
   }
   res.render('lobby', { rooms: availableRooms });
});

app.get('/:roomId', (req, res) => {
   const roomId = req.params.roomId;
   if (!rooms.has(roomId)) {
      res.redirect('/');
      return;
   }
   const room = rooms.get(roomId);
   res.render('room', { roomId , roomName: room.roomName, numClients: room.clients.size });
});

io.on('connection', socket => {
   socket.on('join-room', (roomId) => {
      let room = rooms.get(roomId);
      if (!room) {
         socket.emit('redirect-lobby'); // Emit custom event to redirect to the lobby
         return;
      }
      else {
         room.clients.add(socket.id);
      }
      socket.join(roomId)

      socket.on('send-message', ({username, message}) => {
         const newMessage = { username: username, message: message };
         room.messages.push(newMessage);
         // Emit the 'message-received' event to all clients in the room
         //io.to(roomId).emit('message-received', newMessage);
         socket.to(roomId).emit('message-received', newMessage);
         socket.emit('message-received', newMessage);
         console.log(roomId)
      })

      socket.on('disconnect', () => {
         room.clients.delete(socket.id);
         if (room.clients.size === 0) {
            rooms.delete(roomId);
         }
      })
   });

   socket.on('create-room', (id, roomName) => {
      const roomId = id;
      const newRoom = { clients: new Set(), messages: [], roomName };
      rooms.set(roomId, newRoom);

      socket.emit('room-created', roomId, roomName);
   });
});

server.listen(process.env.PORT || 3000, () => {
   console.log(`Server started. Listening on port ${process.env.PORT || 3000}`);
});