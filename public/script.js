document.addEventListener('DOMContentLoaded', () => {
  const themeToggleButton = document.getElementById('theme-toggle');
  const chatWindow = document.getElementById('chat-window');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const friendsList = document.getElementById('friends-list');
  const friendUsernameInput = document.getElementById('friend-username');
  const addFriendButton = document.getElementById('add-friend-button');
  const friendRequestsList = document.getElementById('friend-requests');
  const outgoingRequestsList = document.getElementById('outgoing-requests');
  const incomingRequestsList = document.getElementById('incoming-requests');

  // Theme toggle functionality
  themeToggleButton.addEventListener('click', () => {
    console.log('[ BUTTON INTERACTION ] Theme toggle clicked');
    document.body.classList.toggle('dark-theme');
  });

  const socket = io({
    auth: {
      token: document.cookie.split('; ').find(row => row.startsWith('token')).split('=')[1]
    }
  });

  socket.on('message', (msg) => {
    console.log(`[ SYSTEM ] Received message: ${JSON.stringify(msg)}`);
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<strong>${msg.sender}</strong>: ${msg.content} <em>${new Date(msg.timestamp).toLocaleTimeString()}</em>`;
    chatWindow.appendChild(messageElement);
  });

  socket.on('friend-request-response', (data) => {
    console.log(`[ SYSTEM ] Friend request response: ${JSON.stringify(data)}`);
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `Your friend request to ${data.username} was ${data.status}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 5000);
  });

  sendButton.addEventListener('click', async () => {
    const message = messageInput.value;
    console.log(`[ BUTTON INTERACTION ] Sending message: ${message}`);
    const response = await fetch('/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chatId: 'general', content: message })
    });
    const result = await response.json();
    console.log(`[ POST ] Message response: ${JSON.stringify(result)}`);
    if (result.status === 'success') {
      socket.emit('message', { content: message, chatId: 'general' });
      messageInput.value = '';
    } else {
      alert(`Failed to send message: ${result.message}`);
    }
  });

  addFriendButton.addEventListener('click', async () => {
    const friendUsername = friendUsernameInput.value;
    console.log(`[ BUTTON INTERACTION ] Adding friend: ${friendUsername}`);
    const response = await fetch('/send-friend-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendUsername })
    });
    const result = await response.json();
    console.log(`[ POST ] Friend request response: ${JSON.stringify(result)}`);
    if (result.status === 'success') {
      alert(`Friend request sent to ${friendUsername}`);
    } else {
      alert(`Failed to send friend request: ${result.message}`);
    }
    friendUsernameInput.value = '';
    loadFriends();
  });

  friendRequestsList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('accept-request')) {
      const friendId = event.target.getAttribute('data-id');
      console.log(`[ BUTTON INTERACTION ] Accepting friend request from: ${friendId}`);
      const response = await fetch('/accept-friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId })
      });
      const result = await response.json();
      console.log(`[ POST ] Accept friend request response: ${JSON.stringify(result)}`);
      loadFriends();
    } else if (event.target.classList.contains('deny-request')) {
      const friendId = event.target.getAttribute('data-id');
      console.log(`[ BUTTON INTERACTION ] Denying friend request from: ${friendId}`);
      const response = await fetch('/deny-friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId })
      });
      const result = await response.json();
      console.log(`[ POST ] Deny friend request response: ${JSON.stringify(result)}`);
      loadFriends();
    }
  });

  async function loadFriends() {
    console.log('[ SYSTEM ] Loading friends');
    const response = await fetch('/friends');
    const friends = await response.json();
    console.log(`[ SYSTEM ] Friends: ${JSON.stringify(friends)}`);
    friendsList.innerHTML = '';
    friends.forEach(friend => {
      const friendElement = document.createElement('li');
      friendElement.textContent = friend.username;
      friendsList.appendChild(friendElement);
    });

    // Load outgoing and incoming requests
    const requestsResponse = await fetch('/friend-requests');
    const { outgoingRequests, incomingRequests } = await requestsResponse.json();

    outgoingRequestsList.innerHTML = '';
    outgoingRequests.forEach(request => {
      const requestElement = document.createElement('li');
      requestElement.textContent = request.username;
      outgoingRequestsList.appendChild(requestElement);
    });

    incomingRequestsList.innerHTML = '';
    incomingRequests.forEach(request => {
      const requestElement = document.createElement('li');
      requestElement.innerHTML = `${request.username} <button class="accept-request" data-id="${request.id}">Accept</button> <button class="deny-request" data-id="${request.id}">Deny</button>`;
      incomingRequestsList.appendChild(requestElement);
    });
  }

  loadFriends();
});
