import { readFromFile, writeToFile } from '../utils/fileUtils.js';
import { log } from '../utils/logger.js';
import path from 'path';

const usersFilePath = path.join('data', 'users.json');
const requestsFilePath = path.join('data', 'requests.json');
const messagesFilePath = path.join('data', 'messages.json');

export const getChatPage = (req, res) => {
  log.system('Loading chat page');
  const users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id) || { friends: [], friendRequests: [] };
  const friends = (user.friends || []).map(friendId => users.find(u => u.id === friendId) || {});
  const friendRequests = (user.friendRequests || []).map(requestId => users.find(u => u.id === requestId) || {});
  const requests = readFromFile(requestsFilePath);
  const outgoingRequests = requests.filter(req => req.senderId === user.id);
  const incomingRequests = requests.filter(req => req.receiverId === user.id);
  const messages = readFromFile(messagesFilePath);
  res.render('chat', { title: 'Chat', username: req.user.username, friends, friendRequests, outgoingRequests, incomingRequests, currentFriend: null, messages: messages });
};

export const sendMessage = (req, res) => {
  const { chatId, content } = req.body;
  log.postRequest(`Sending message to chat ${chatId}`);
  const messages = readFromFile(messagesFilePath);
  const newMessage = {
    sender: req.user.username,
    content,
    chatId,
    timestamp: new Date().toISOString()
  };
  messages.push(newMessage);
  writeToFile(messagesFilePath, messages);
  log.fileWritingSuccess(`Message from ${req.user.username} saved to messages.json`);

  req.io.to(chatId).emit('message', newMessage);
  log.successPost(`Message sent to chat: ${chatId}`);
  res.json({ status: 'success', message: 'Message sent' });
};
