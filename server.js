// server.js
// This is the "brain" of the website. It runs on Node.js.
// It does 3 jobs:
//   1. Serves the HTML/CSS/JS files in the "public" folder to visitors.
//   2. Keeps a "waiting line" (queue) of people who clicked "Start".
//   3. Pairs up two waiting people and passes their messages back and forth.

const express = require("express");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// This serves every file inside the "public" folder as a normal website file.
app.use(express.static("public"));

// ---- In-memory state (resets if the server restarts) ----
let waitingQueue = [];              // socket ids waiting for a partner
let partners = {};                  // socket.id -> partner's socket.id
let blockedBy = {};                 // socket.id -> Set of socket ids they've blocked (this session only)

function removeFromQueue(socketId) {
  waitingQueue = waitingQueue.filter((id) => id !== socketId);
}

// True if either person has blocked the other, this session.
function isBlockedPair(a, b) {
  return (blockedBy[a] && blockedBy[a].has(b)) || (blockedBy[b] && blockedBy[b].has(a));
}

// Looks through the waiting line for the first person NOT blocked by/from this user.
function findAvailablePartner(socketId) {
  for (let i = 0; i < waitingQueue.length; i++) {
    const candidateId = waitingQueue[i];
    if (!isBlockedPair(socketId, candidateId)) {
      waitingQueue.splice(i, 1);
      return candidateId;
    }
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // User clicked "Start" / "Find a stranger"
  socket.on("find-partner", () => {
    // Safety: if they were already chatting, clean that up first.
    endChatFor(socket.id, false);

    const partnerId = findAvailablePartner(socket.id);

    if (partnerId) {
      // Found someone available -> pair them together
      partners[socket.id] = partnerId;
      partners[partnerId] = socket.id;

      io.to(socket.id).emit("chat-start");
      io.to(partnerId).emit("chat-start");
    } else {
      // Nobody available -> put this user in the queue
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

  // User clicked "Report" on their current partner.
  socket.on("report-user", (reason) => {
    const partnerId = partners[socket.id];
    const line = `${new Date().toISOString()} | reporter=${socket.id} | reported=${partnerId || "none"} | reason=${(reason || "(no reason given)").replace(/\n/g, " ")}\n`;
    fs.appendFile("reports.log", line, (err) => {
      if (err) console.error("Failed to write report:", err);
    });
    socket.emit("report-received");
  });

  // User clicked "Block" on their current partner.
  socket.on("block-user", () => {
    const partnerId = partners[socket.id];
    if (partnerId) {
      if (!blockedBy[socket.id]) blockedBy[socket.id] = new Set();
      blockedBy[socket.id].add(partnerId);
      endChatFor(socket.id, true);
      socket.emit("block-confirmed");
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    removeFromQueue(socket.id);
    endChatFor(socket.id, true);
    delete blockedBy[socket.id]; // blocks only last for the current session
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
