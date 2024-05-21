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
      document.body.classList.toggle('dark-theme');
    });
  
    const socket = io({
      auth: {
        token: document.cookie.split('; ').find(row => row.startsWith('token')).split('=')[1]
      }
    });
  
    socket.on('message', (msg) => {
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      messageElement.innerHTML = `<strong>${msg.sender}</strong>: ${msg.content} <em>${new Date(msg.timestamp).toLocaleTimeString()}</em>`;
      chatWindow.appendChild(messageElement);
    });
  
    socket.on('friend-request-response', (data) => {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.innerHTML = `Your friend request to ${data.username} was ${data.status}`;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 5000);
    });
  
    sendButton.addEventListener('click', () => {
      const message = messageInput.value;
      socket.emit('message', { content: message, chatId: 'general' });
      messageInput.value = '';
    });
  
    addFriendButton.addEventListener('click', async () => {
      const friendUsername = friendUsernameInput.value;
      console.log(`Adding friend: ${friendUsername}`); // Log the friend username
      const response = await fetch('/send-friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendUsername })
      });
      const result = await response.json();
      console.log(result); // Log the response from the server
      friendUsernameInput.value = '';
      loadFriends();
    });
  
    friendRequestsList.addEventListener('click', async (event) => {
      if (event.target.classList.contains('accept-request')) {
        const friendId = event.target.getAttribute('data-id');
        console.log(`Accepting friend request from: ${friendId}`); // Log the friend ID
        const response = await fetch('/accept-friend-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendId })
        });
        const result = await response.json();
        console.log(result); // Log the response from the server
        loadFriends();
      } else if (event.target.classList.contains('deny-request')) {
        const friendId = event.target.getAttribute('data-id');
        console.log(`Denying friend request from: ${friendId}`); // Log the friend ID
        const response = await fetch('/deny-friend-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendId })
        });
        const result = await response.json();
        console.log(result); // Log the response from the server
        loadFriends();
      }
    });
  
    async function loadFriends() {
      const response = await fetch('/friends');
      const friends = await response.json();
      friendsList.innerHTML = '';
      friends.forEach(friend => {
        const friendElement = document.createElement('li');
        friendElement.textContent = friend.username;
        friendsList.appendChild(friendElement);
      });
  
      // Load outgoing and incoming requests
      const chatPageResponse = await fetch('/chat');
      const chatPageData = await chatPageResponse.text();
      document.querySelector('.chat-container').innerHTML = chatPageData;
    }
  
    loadFriends();
  });
  