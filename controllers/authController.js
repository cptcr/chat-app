import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { readFromFile, writeToFile } from '../utils/fileUtils.js';
import { log } from '../utils/logger.js';
import path from 'path';

const usersFilePath = path.join('data', 'users.json');

export const signup = async (req, res) => {
  const { username, password } = req.body;
  log.postRequest(`Sign up attempt for ${username}`);
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
  log.fileWritingSuccess(`New user ${username} added to users.json`);

  const token = jwt.sign({ id: newUser.id, username: newUser.username }, 'secret_key');
  res.cookie('token', token, { httpOnly: true });
  log.successPost(`New user ${username} signed up and logged in!`);
  res.redirect('/chat');
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  log.postRequest(`Login attempt for ${username}`);
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
};
