// server.js
// This is the "brain" of the website. It runs on Node.js.
// It does 3 jobs:
//   1. Serves the HTML/CSS/JS files in the "public" folder to visitors.
//   2. Keeps a "waiting line" (queue) of people who clicked "Start".
//   3. Pairs up two waiting people and passes their messages back and forth.

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// This serves every file inside the "public" folder as a normal website file.
app.use(express.static("public"));

// ---- In-memory state (resets if the server restarts) ----
let waitingQueue = [];              // socket ids waiting for a partner
let partners = {};                  // socket.id -> partner's socket.id

function removeFromQueue(socketId) {
  waitingQueue = waitingQueue.filter((id) => id !== socketId);
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // User clicked "Start" / "Find a stranger"
  socket.on("find-partner", () => {
    // Safety: if they were already chatting, clean that up first.
    endChatFor(socket.id, false);

    if (waitingQueue.length > 0) {
      // Someone is already waiting -> pair them together
      const partnerId = waitingQueue.shift();
      partners[socket.id] = partnerId;
      partners[partnerId] = socket.id;

      io.to(socket.id).emit("chat-start");
      io.to(partnerId).emit("chat-start");
    } else {
      // Nobody is waiting -> put this user in the queue
      waitingQueue.push(socket.id);
      socket.emit("waiting");
    }
  });

  // User sent a chat message
  socket.on("send-message", (text) => {
    const partnerId = partners[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("receive-message", text);
    }
  });

  // Typing indicator (optional nice touch)
  socket.on("typing", (isTyping) => {
    const partnerId = partners[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("partner-typing", isTyping);
    }
  });

  // User clicked "Next" / "Stop"
  socket.on("leave-chat", () => {
    endChatFor(socket.id, true);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    removeFromQueue(socket.id);
    endChatFor(socket.id, true);
  });

  // Ends the current chat for this socket and tells the partner.
  function endChatFor(socketId, notifyPartner) {
    const partnerId = partners[socketId];
    if (partnerId) {
      delete partners[socketId];
      delete partners[partnerId];
      if (notifyPartner) {
        io.to(partnerId).emit("partner-left");
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
