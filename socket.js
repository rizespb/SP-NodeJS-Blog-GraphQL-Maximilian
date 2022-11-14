let io

module.exports = {
  init: (httpServer) => {
    // Установка webSocket-соединения
    // Начиная с версии Socket.IO v3 надо прописывать CORS-ы и для webSocket-соединения
    io = require('socket.io')(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    return io
  },
  // Поулчить сущность io
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!')
    }

    return io
  },
}
