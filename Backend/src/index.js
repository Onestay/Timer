// initial setup
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const server = require('http').createServer(app);
const helmet = require('helmet');
const io = require('socket.io')(server);
const path = require('path');

app.use(helmet());
app.use('/static', express.static(path.join(__dirname, 'public', 'static')));
app.use(cors());
app.use(bodyParser.json());

require('./routes/routes.js')(app, io);

server.listen(5555, () => {
	console.log('Listening on Port 5555');
});
