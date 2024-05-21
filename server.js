import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const log = {
  system: (msg) => console.log(chalk.blue(`[ SYSTEM ] ${msg}`)),
  postRequest: (msg) => console.log(chalk.yellow(`[ POST ] ${msg}`)),
  successPost: (msg) => console.log(chalk.green(`[ SUCCESS POST ] ${msg}`)),
  userAction: (msg) => console.log(chalk.hex('#FF69B4')(`[ USER ACTION ] ${msg}`)),
  friendRequest: (msg) => console.log(chalk.magenta(`[ FRIEND REQUEST ] ${msg}`)),
  writingFile: (msg) => console.log(chalk.hex('#FFA500')(`[ WRITING FILE ] ${msg}`)),
  fileWritingSuccess: (msg) => console.log(chalk.hex('#FFD580')(`[ FILE WRITING SUCCESS ] ${msg}`)),
  buttonInteraction: (msg) => console.log(chalk.white(`[ BUTTON INTERACTION ] ${msg}`)),
  failedAttempt: (msg) => console.log(chalk.red(`[ FAILED ATTEMPT ] ${msg}`))
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const usersFilePath = path.join(__dirname, 'users.json');
const messagesFilePath = path.join(__dirname, 'messages.json');
const requestsFilePath = path.join(__dirname, 'requests.json');

const readFromFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return [];
  }
};

const writeToFile = (filePath, data) => {
  log.writingFile(`Writing to file: ${filePath}`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    log.fileWritingSuccess(`Successfully wrote to file: ${filePath}`);
  } catch (err) {
    console.error(`Error writing to file ${filePath}:`, err);
  }
};

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (token == null) {
    log.failedAttempt(`Token missing. Redirecting to login.`);
    return res.redirect('/login');
  }

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      log.failedAttempt(`Token verification failed. Redirecting to login.`);
      return res.redirect('/login');
    }
    req.user = user;
    next();
  });
};

app.get('/', authenticateToken, (req, res) => {
  res.redirect('/chat');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readFromFile(usersFilePath);
  const user = users.find(u => u.username === username);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key');
    res.cookie('token', token, { httpOnly: true });
    log.successPost(`${username} logged in!`);
    res.redirect('/chat');
  } else {
    log.failedAttempt(`${username} login failed on client IP: ${req.ip}`);
    res.render('login', { title: 'Login', error: 'Invalid username or password' });
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  let users = readFromFile(usersFilePath);
  const existingUser = users.find(user => user.username === username);

  if (existingUser) {
    log.failedAttempt(`Sign up failed for ${username}: Username already exists`);
    return res.render('signup', { title: 'Sign Up', error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), username, password: hashedPassword, friends: [], friendRequests: [] };
  users.push(newUser);
  writeToFile(usersFilePath, users);

  const token = jwt.sign({ id: newUser.id, username: newUser.username }, 'secret_key');
  res.cookie('token', token, { httpOnly: true });
  log.successPost(`New user ${username} signed up and logged in!`);
  res.redirect('/chat');
});

app.get('/chat', authenticateToken, (req, res) => {
  const users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id) || { friends: [], friendRequests: [] };
  const friends = (user.friends || []).map(friendId => users.find(u => u.id === friendId) || {});
  const friendRequests = (user.friendRequests || []).map(requestId => users.find(u => u.id === requestId) || {});
  const requests = readFromFile(requestsFilePath);
  const outgoingRequests = requests.filter(req => req.senderId === user.id);
  const incomingRequests = requests.filter(req => req.receiverId === user.id);
  log.system('Loading chat page');
  res.render('chat', { title: 'Chat', username: req.user.username, friends, friendRequests, outgoingRequests, incomingRequests, currentFriend: null, messages: [] });
});

app.post('/send-friend-request', authenticateToken, (req, res) => {
  const { friendUsername } = req.body;
  let users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);
  const friend = users.find(u => u.username === friendUsername);

  log.friendRequest(`Received friend request from: ${user.username} to: ${friendUsername}`);

  if (!friend) {
    log.failedAttempt(`User not found for friend request: ${friendUsername}`);
    return res.status(404).json({ message: 'User not found' });
  }

  if (!friend.friendRequests.includes(user.id) && !friend.friends.includes(user.id)) {
    friend.friendRequests.push(user.id);
    writeToFile(usersFilePath, users);

    // Log the friend request in the requests file
    let requests = readFromFile(requestsFilePath);
    requests.push({ senderId: user.id, receiverId: friend.id, timestamp: new Date().toISOString() });
    writeToFile(requestsFilePath, requests);
  }

  log.friendRequest(`Friend request sent to: ${friendUsername}`);
  res.json({ status: 'success', message: 'Friend request sent' });
});

app.post('/accept-friend-request', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  let users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);
  const friend = users.find(u => u.id === friendId);

  if (friend) {
    user.friends.push(friend.id);
    friend.friends.push(user.id);

    user.friendRequests = user.friendRequests.filter(requestId => requestId !== friendId);

    writeToFile(usersFilePath, users);

    // Notify the friend that their request was accepted
    io.to(friendId).emit('friend-request-response', { status: 'accepted', username: user.username });

    // Remove the friend request from the requests file
    let requests = readFromFile(requestsFilePath);
    requests = requests.filter(req => !(req.senderId === friend.id && req.receiverId === user.id));
    writeToFile(requestsFilePath, requests);
  }

  log.successPost(`Friend request accepted: ${friendId}`);
  res.json({ status: 'success', message: 'Friend request accepted' });
});

app.post('/deny-friend-request', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  let users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);

  user.friendRequests = user.friendRequests.filter(requestId => requestId !== friendId);
  writeToFile(usersFilePath, users);

  // Notify the friend that their request was denied
  io.to(friendId).emit('friend-request-response', { status: 'denied', username: user.username });

  // Remove the friend request from the requests file
  let requests = readFromFile(requestsFilePath);
  requests = requests.filter(req => !(req.senderId === friendId && req.receiverId === user.id));
  writeToFile(requestsFilePath, requests);

  log.failedAttempt(`Friend request denied: ${friendId}`);
  res.json({ status: 'success', message: 'Friend request denied' });
});

app.get('/friends', authenticateToken, (req, res) => {
  const users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id) || { friends: [] };
  const friends = (user.friends || []).map(friendId => users.find(u => u.id === friendId) || {});
  res.json(friends);
});

app.get('/messages/:chatId', authenticateToken, (req, res) => {
  const messages = readFromFile(messagesFilePath);
  const chatMessages = messages.filter(message => message.chatId === req.params.chatId);
  res.json(chatMessages);
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    jwt.verify(token, 'secret_key', (err, user) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = user;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
});

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

    io.to(data.chatId).emit('message', newMessage);
    log.successPost(`Message sent to chat: ${data.chatId}`);
  });

  socket.on('disconnect', () => {
    log.system('User disconnected');
  });
});

const port = 3000;
server.listen(port, '0.0.0.0', () => {
  log.system(`Server started on port: ${port}`);
});
