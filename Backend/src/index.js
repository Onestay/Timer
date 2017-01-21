// initial setup
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

app.use(express.static(`${__dirname}\\public`));
// app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());


app.post('/updateTime', (req, res) => {
	res.status(204).send('success!');
//	console.log(req.body.time);
	io.emit('new time', req.body.time);
});

app.post('/css', (req, res) => {
	res.status(204).send('success!');
	console.log(req.body);
	io.emit('new css', req.body)
});

app.post('/colorChange', (req, res) => {
	res.status(204).send('success');
	io.emit('color change', req.body.color)
});

server.listen(5555, () => {
	console.log('Listening on Port 5555');
});

io.on('connection', (socket) => {
	console.log('Client connected.');
	socket.on('disconnect', () => {
		console.log('Socket connection lost');
	})
})
