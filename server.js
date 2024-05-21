import { log } from './utils/logger.js';
log.system("Initialize server...")
log.system("Importing required packages...")
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import { readFromFile, writeToFile } from './utils/fileUtils.js';
import path from 'path';
log.system("Import success")

log.system("Setting up express...")
log.system("Creating app...")
const app = express();
log.system("Express app created")
log.system("Creating http server...")
const server = http.createServer(app);
log.system("Http server created")
log.system("Setting up IO server...")
const io = new Server(server);
log.system("IO server created")

log.system("Adding cors to app...")
app.use(cors({ origin: true, credentials: true }));
log.system("Added cors to app")
log.system("Adding JSON...")
app.use(express.json());
log.system("JSON added")
log.system("Encoding URL...")
app.use(express.urlencoded({ extended: true }));
log.system("URL encoded")
log.system("Adding cookie parser")
app.use(cookieParser());
log.system("Cookie parser added")
log.system("Using public directory for static output...")
app.use(express.static('public'));
log.system("Added public for a static output")
log.system("Set the view engine to ejs...")
app.set('view engine', 'ejs');
log.system("View engine set to ejs")

log.system("Adding data files...")
const usersFilePath = path.join('data', 'users.json');
log.system("Added user data")
const messagesFilePath = path.join('data', 'messages.json');
log.system("Added message data")
const requestsFilePath = path.join('data', 'requests.json');
log.system("Added request data")
log.system("Data files added")

// Set io to be accessible in req
log.system("Setting IO to be accessible in req...")
app.use((req, res, next) => {
  req.io = io;
  next();
});
log.system("IO is now accessible in req")

log.system("Adding routes...")
app.use(authRoutes);
log.system("Authentication routes added")
app.use(chatRoutes);
log.system("Chat routes added")
app.use(friendRoutes);
log.system("Friend routes added")
log.system("All routes added")

log.system("Setting up IO...")
io.use((socket, next) => {
    log.system("Creating handshake auth token...")
  const token = socket.handshake.auth.token;
  log.system("Handshake auth token created")
  if (token) {
    log.system("Verify token...")
    jwt.verify(token, 'secret_key', (err, user) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = user;
      next();
    });
    log.system("Token verified")
  } else {
    next(new Error('Authentication error'));
  }
});
log.system("IO setup done")

io.on('connection', (socket) => {
  log.system('A user connected');
  socket.join(socket.user.id);

  socket.on('join', (chatId) => {
    socket.join(chatId);
    log.system(`User joined chat: ${chatId}`);
  });

  socket.on('message', (data) => {
    const messages = readFromFile(messagesFilePath);
    const newMessage = {
      sender: socket.user.username,
      content: data.content,
      chatId: data.chatId,
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    writeToFile(messagesFilePath, messages);
    log.fileWritingSuccess(`Message from ${socket.user.username} saved to messages.json`);

    io.to(data.chatId).emit('message', newMessage);
    log.successPost(`Message sent to chat: ${data.chatId}`);
  });

  socket.on('disconnect', () => {
    log.system('User disconnected');
  });
});

log.system("Creating server...")
const port = 3000;
server.listen(port, '0.0.0.0', () => {
  log.system(`Server started on port: ${port}`);
});
log.system("Server created")