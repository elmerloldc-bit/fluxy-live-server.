const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Permite conexiones de tu app y dashboard
});

// Ruta obligatoria para que Render sepa que el servidor está vivo
app.get('/', (req, res) => {
  res.send('Fluxy Live Server is running! 🚀');
});

// Guardamos en la memoria RAM (Infinitamente rápido y gratis)
const activeStreams = {};

io.on('connection', (socket) => {
  console.log('✅ Nuevo cliente conectado:', socket.id);

  // La App de escritorio del streamer avisa cada 3 segundos cuántos viewers tiene
  socket.on('update_viewers', (data) => {
    // data esperado: { hwid: '123', nickname: 'Elmerciot', viewers: 1500, game: 'Mario 64' }
    if (!data.hwid) return;
    activeStreams[data.hwid] = {
      nickname: data.nickname,
      viewers: data.viewers,
      game: data.game || 'N/A',
      lastUpdate: Date.now()
    };
    
    // Le enviamos la lista completa a todos los dashboards conectados
    io.emit('dashboard_update', Object.values(activeStreams));
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// 🧹 Limpieza automática: Si un streamer no envía datos por 10 segundos, lo borramos de la lista
setInterval(() => {
  const now = Date.now();
  let changed = false;
  
  for (const hwid in activeStreams) {
    if (now - activeStreams[hwid].lastUpdate > 10000) {
      delete activeStreams[hwid];
      changed = true;
    }
  }
  
  // Si alguien se cayó por mal internet o cerró la app de golpe, actualizamos el Dashboard
  if (changed) {
    io.emit('dashboard_update', Object.values(activeStreams));
  }
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Live escuchando en el puerto ${PORT}`);
});
