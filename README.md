<!DOCTYPE html>
<html>
<body>
<h1 align="center">Chat App</h1>
<p align="center">A simple chat application built with Node.js, Express, Socket.io, and EJS.</p>

<h2>Features</h2>
<ul>
  <li>User authentication (signup and login)</li>
  <li>Add friends by username</li>
  <li>Send and receive friend requests</li>
  <li>Real-time messaging</li>
  <li>Dark mode toggle</li>
  <li>Persistent data storage using JSON files</li>
</ul>

<h2>Installation</h2>
<ol>
  <li>Clone the repository:</li>
</ol>
<pre><code>git clone https://github.com/toowake/chat-app.git
cd chat-app
</code></pre>
<ol start="2">
  <li>Install dependencies:</li>
</ol>
<pre><code>npm install</code></pre>
<ol start="3">
  <li>Start the server:</li>
</ol>
<pre><code>npm start</code></pre>
<ol start="4">
  <li>Open your browser and go to <a href="http://localhost:3000">http://localhost:3000</a>.</li>
</ol>

<h2>Project Structure</h2>
<pre><code>
chat-app/
├── public/
│   ├── style.css
│   └── script.js
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   └── chat.ejs
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   ├── friendController.js
├── models/
│   ├── userModel.js
│   ├── messageModel.js
│   ├── requestModel.js
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── friendRoutes.js
├── middlewares/
│   ├── authMiddleware.js
├── utils/
│   ├── fileUtils.js
│   ├── logger.js
├── data/
│   ├── users.json
│   ├── messages.json
│   ├── requests.json
├── server.js
├── package.json
└── README.md
</code></pre>

<h2>License</h2>
<p>This project is licensed under the MIT License - see the <a href="LICENSE">LICENSE</a> file for details.</p>
</body>
</html>
