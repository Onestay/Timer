module.exports = (app, io) => {
	const keypress = require('keypress');
	const timerFunctions = require('../functions/timer.js');
	const auth = require('../functions/auth.js');
	const path = require('path');
	keypress(process.stdin);

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
		timerFunctions.donePlayer(req.body.index, req.body.time, io);
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

	app.post('/updateSettings', (req, res) => {
		console.log('Settings Updated');
		timerFunctions.updateSettings(req.body, io);
		res.status(200).send();
	});

	app.post('/split', (req, res) => {
		console.log('Split');
		timerFunctions.split(req.body.player, io);
		res.status(200).send();
	});

	app.post('/splitStop', (req, res) => {
		console.log('Split stop');
		timerFunctions.splitStop(req.body.player, io);
		res.status(200).send();
	});

	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
	});

	// this doesn't really belong here. Will probably move this into a different file later
	io.on('connection', () => {
		console.log('Client connected.');
		let state = timerFunctions.getState();
		io.emit('currentState', state);
	});

	process.stdin.on('keypress', (ch, key) => {
		const timerKey = 'g';
		let state = timerFunctions.getState();
		if (key.name === timerKey) {
			if (state.isRunning === false) {
				return timerFunctions.startCount(io);
			}
			timerFunctions.donePlayer(0, 0, io);
		}

		if (key && key.ctrl && key.name === 'c') {
			process.stdin.pause();
		}
	});
};
