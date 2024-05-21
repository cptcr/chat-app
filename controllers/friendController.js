import { readFromFile, writeToFile } from '../utils/fileUtils.js';
import { log } from '../utils/logger.js';
import path from 'path';

const usersFilePath = path.join('data', 'users.json');
const requestsFilePath = path.join('data', 'requests.json');

export const sendFriendRequest = (req, res) => {
  const { friendUsername } = req.body;
  log.postRequest(`Friend request attempt to ${friendUsername}`);
  let users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);
  const friend = users.find(u => u.username === friendUsername);

  log.friendRequest(`Received friend request from: ${user.username} to: ${friendUsername}`);

  if (!friend) {
    log.failedAttempt(`User not found for friend request: ${friendUsername}`);
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }

  if (!friend.friendRequests.includes(user.id) && !friend.friends.includes(user.id)) {
    friend.friendRequests.push(user.id);
    writeToFile(usersFilePath, users);
    log.fileWritingSuccess(`Friend request from ${user.username} to ${friendUsername} saved to users.json`);

    // Log the friend request in the requests file
    let requests = readFromFile(requestsFilePath);
    requests.push({ senderId: user.id, receiverId: friend.id, timestamp: new Date().toISOString() });
    writeToFile(requestsFilePath, requests);
    log.fileWritingSuccess(`Friend request logged in requests.json`);
  }

  log.friendRequest(`Friend request sent to: ${friendUsername}`);
  res.json({ status: 'success', message: 'Friend request sent' });
};

export const acceptFriendRequest = (req, res) => {
  const { friendId } = req.body;
  log.postRequest(`Accepting friend request from ${friendId}`);
  let users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);
  const friend = users.find(u => u.id === friendId);

  if (friend) {
    user.friends.push(friend.id);
    friend.friends.push(user.id);

    user.friendRequests = user.friendRequests.filter(requestId => requestId !== friendId);

    writeToFile(usersFilePath, users);
    log.fileWritingSuccess(`Friendship between ${user.username} and ${friend.username} saved to users.json`);

    // Notify the friend that their request was accepted
    req.io.to(friendId).emit('friend-request-response', { status: 'accepted', username: user.username });

    // Remove the friend request from the requests file
    let requests = readFromFile(requestsFilePath);
    requests = requests.filter(req => !(req.senderId === friend.id && req.receiverId === user.id));
    writeToFile(requestsFilePath, requests);
    log.fileWritingSuccess(`Friend request removed from requests.json`);
  }

  log.successPost(`Friend request accepted: ${friendId}`);
  res.json({ status: 'success', message: 'Friend request accepted' });
};

export const denyFriendRequest = (req, res) => {
  const { friendId } = req.body;
  log.postRequest(`Denying friend request from ${friendId}`);
  let users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);

  user.friendRequests = user.friendRequests.filter(requestId => requestId !== friendId);
  writeToFile(usersFilePath, users);
  log.fileWritingSuccess(`Friend request denied for ${friendId}`);

  // Notify the friend that their request was denied
  req.io.to(friendId).emit('friend-request-response', { status: 'denied', username: user.username });

  // Remove the friend request from the requests file
  let requests = readFromFile(requestsFilePath);
  requests = requests.filter(req => !(req.senderId === friendId && req.receiverId === user.id));
  writeToFile(requestsFilePath, requests);
  log.fileWritingSuccess(`Friend request removed from requests.json`);

  log.failedAttempt(`Friend request denied: ${friendId}`);
  res.json({ status: 'success', message: 'Friend request denied' });
};

export const getFriends = (req, res) => {
  log.system('Fetching friends list');
  const users = readFromFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id) || { friends: [] };
  const friends = (user.friends || []).map(friendId => users.find(u => u.id === friendId) || {});
  res.json(friends);
};

export const getFriendRequests = (req, res) => {
  log.system('Fetching friend requests');
  const users = readFromFile(usersFilePath);
  const requests = readFromFile(requestsFilePath);
  const user = users.find(u => u.id === req.user.id) || { friendRequests: [] };

  const outgoingRequests = requests.filter(req => req.senderId === user.id).map(req => {
    const receiver = users.find(u => u.id === req.receiverId);
    return { id: req.receiverId, username: receiver.username };
  });

  const incomingRequests = user.friendRequests.map(requestId => {
    const sender = users.find(u => u.id === requestId);
    return { id: requestId, username: sender.username };
  });

  res.json({ outgoingRequests, incomingRequests });
};
