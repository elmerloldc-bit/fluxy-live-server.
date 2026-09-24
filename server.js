const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.get('/', (req, res) => {
  res.send('Fluxy Live Server is running! 🚀');
});

const activeStreams = {};

io.on('connection', (socket) => {
  console.log('✅ Nuevo cliente conectado:', socket.id);

  socket.on('update_viewers', (data) => {
    if (!data.hwid) return;
    activeStreams[data.hwid] = {
      nickname: data.nickname,
      avatar: data.avatar, // <-- ARREGLO DE LAS FOTOS AQUI
      viewers: data.viewers,
      game: data.game || 'N/A',
      lastUpdate: Date.now()
    };
    
    io.emit('dashboard_update', Object.values(activeStreams));
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Limpieza cada 30 segundos (ARREGLO DE LOS CORTES)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  
  for (const hwid in activeStreams) {
    if (now - activeStreams[hwid].lastUpdate > 30000) {
      delete activeStreams[hwid];
      changed = true;
    }
  }
  
  if (changed) {
    io.emit('dashboard_update', Object.values(activeStreams));
  }
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Live escuchando en el puerto ${PORT}`);
});
