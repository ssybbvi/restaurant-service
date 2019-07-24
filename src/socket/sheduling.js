export default function Init(io) {
  io.on('connection', function (socket) {
    socket.on('SEND_MESSAGE', function (data) {
      io.emit('MESSAGE', data)
    });
  });
}