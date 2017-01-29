module.exports = (app, io) => {

	const timerFunctions = require('../functions/timer.js');
	const auth = require('../functions/auth.js');

	app.get('/startTimer', (req, res) => {
		res.status(200).send();
		timerFunctions.startCount(io);
		console.log('Starting timer');
	});

	app.get('/stopTimer', (req, res) => {
		res.status(200).send();
		timerFunctions.stopCount(io);
		console.log('Stopping timer');
	});

	app.get('/resetTimer', (req, res) => {
		res.status(200).send();
		timerFunctions.resetCount(io);
		console.log('Reseting timer');
	});

	app.get('/resumeTimer', (req, res) => {
		res.status(200).send();
		timerFunctions.resumeCount(io);
		console.log('Resuming timer');
	});

	app.post('/addPlayer', (req, res) => {
		res.status(200).send();
		console.log('Player add');
		timerFunctions.addPlayer(io, {
			players: req.body.players,
			est: req.body.est
		});
	});

	app.post('/donePlayer', (req, res) => {
		res.status(200).send();
		console.log(`Player ${req.body.index} finished`);
		timerFunctions.donePlayer(req.body.index, io);
	});

	app.post('/validateKey', (req, res) => {
		auth.validateKey(req.body.url).then((data) => {
			if (data) {
				res.status(202).send();
			} else {
				res.status(200).send();
			}
		});
	});

	// this doesn't really belong here. Will probably move this into a different file later
	io.on('connection', () => {
		console.log('Client connected.');
		let state = timerFunctions.getState();
		io.emit('currentState', (state));
	});
}