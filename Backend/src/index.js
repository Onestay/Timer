// initial setup
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server)

io.set('origins', '*:*');

app.use(cors());
app.use(bodyParser.json());


require('./routes/routes.js')(app, io);

server.listen(5555, () => {
	console.log('Listening on Port 5555');
});
