// these are the functions needed to control the timer on the front-end
let incrementer;
let startTime;
let startSplitTime;
let lastStopped;
let updateTime = 300;

// vars to make the split thingy work
let splitIncrementer;
let splitRunning;
let playerWhoSplit;
let updateSplitTime = 300;
let splitDelta;


// these are set to something to just have a default state
let delta = 0;
let isReset = 'startup';
let isRunning = false;

// players
let players = [];

// settings
let fontFamily = 'Arial';
let fontSize = 100;
let colorFinished = '#4CAF50';
let colorPaused = '#9E9E9E';
let colorStartup = '#000000';
let colorRunning = '#03A9F4';
let currentColor;
let timerFormat = 'normal';

exports.split = (playerIndex, io) => {
	startSplitTime = Date.now();
	increment(io, startSplitTime);
	splitRunning = true;
	playerWhoSplit = playerIndex;
	players[playerIndex].splitDone = true;
	splitIncrementer = setInterval(() => { increment(io, startSplitTime); }, updateSplitTime);
	for (let i = 0; i < players.length; i++) {
		if (i !== playerWhoSplit) {
			// this will set shouldShowSplit to true for everybody not having pressed split
			players[i].shouldShowSplit = true;
		}
	}
	io.emit('splitRunningUpdate', { splitRunning: splitRunning });
	io.emit('addPlayer', { players: players });
};

exports.splitStop = (playerIndex, io) => {
	if (playerIndex === playerWhoSplit) return;

	// settings the time to the current split time and split done to true
	players[playerIndex].splitTime = splitDelta;
	players[playerIndex].splitDone = true;

	if (players.every(i => i.splitDone === true)) {
		clearInterval(splitIncrementer);
		setTimeout(() => {
			players.forEach((current) => {
				// reseting everything
				current.shouldShowSplit = false;
				current.splitDone = false;
				current.splitTime = 0;
			});
			splitRunning = false;
			io.emit('splitRunningUpdate', { splitRunning: splitRunning });
			io.emit('addPlayer', { players: players });
		}, 1000);
	}

	io.emit('splitRunningUpdate', { splitRunning: splitRunning });
	io.emit('addPlayer', { players: players });
};

exports.postSettings = (io) => {
	// post settings to the main timer
	io.emit('settings', {
		fontFamily: fontFamily,
		fontSize: fontSize,
		timerFormat: timerFormat
	});
};

function postColor(color, io) {
	currentColor = color;
	io.emit('colorChange', { color: color });
}

exports.updateSettings = (data, io) => {
	if (data.timerFormat === 'milli' || data.timerFormat === 'dynHoursMilli') {
		updateTime = 1;
		clearInterval(incrementer);
		incrementer = setInterval(() => { increment(io); }, updateTime);
	} else {
		updateTime = 300;
		clearInterval(incrementer);
		incrementer = setInterval(() => { increment(io); }, updateTime);
	}
	io.emit('settings', {
		fontFamily: fontFamily = data.fontFamily,
		fontSize: fontSize = data.fontSize,
		colorFinished: colorFinished = data.colorFinished,
		colorStartup: colorStartup = data.colorStartup,
		colorPaused: colorPaused = data.colorPaused,
		colorRunning: colorRunning = data.colorRunning,
		timerFormat: timerFormat = data.timerFormat
	});
};


exports.startCount = (io) => {
	startTime = Date.now();
	isRunning = true;
	isReset = 'running';
	io.emit('isRunningUpdate', true);
	io.emit('isResetUpdate', 'running');
	increment(io);
	incrementer = setInterval(() => { increment(io); }, updateTime);
	postColor(colorRunning, io);
};

exports.stopCount = (io) => {
	lastStopped = Date.now();
	clearInterval(incrementer);
	incrementer = null;
	isRunning = false;
	isReset = 'stopped';
	io.emit('isRunningUpdate', isRunning);
	io.emit('isResetUpdate', isReset);
	postColor(colorPaused, io);
};

exports.resetCount = (io) => {
	delta = 0;
	isRunning = false;
	isReset = 'startup';
	players = [];
	io.emit('addPlayer', { players: players });
	io.emit('isRunningUpdate', isRunning);
	io.emit('isResetUpdate', isReset);
	io.emit('timeUpdate', { secondsElapsed: delta });
	postColor(colorStartup, io);
};

exports.resumeCount = (io) => {
	if (players.every(i => i.finished === true && players.length > 1)) {
		return;
	}

	startTime += Date.now() - lastStopped;
	isRunning = true;
	isReset = 'running';
	io.emit('isRunningUpdate', isRunning);
	io.emit('isResetUpdate', isReset);
	increment(io);
	incrementer = setInterval(() => { increment(io); }, updateTime);

	if (players.every(i => i.finished === true) && players.length === 1) {
		for (let i = 0; i < players.length; i++) {
			players[i].finished = false;
			players[i].time = delta;
			players[i].class = 'player-time-player-running timer-player-wrapper';
		}
		io.emit('addPlayer', { players: players });
	}

	postColor(colorRunning, io);
};

exports.getState = () => {
	return {
		delta: delta,
		isReset: isReset,
		isRunning: isRunning,
		players: players,
		fontFamily: fontFamily,
		fontSize: fontSize,
		colorFinished: colorFinished,
		colorStartup: colorStartup,
		colorPaused: colorPaused,
		colorRunning: colorRunning,
		currentColor: currentColor,
		timerFormat: timerFormat
	};
};

function increment(io, time) {
	let fromSplit = time !== undefined;
	let timeToSub = time || startTime;
	let difference = Math.round(((Date.now() - timeToSub) / 1000) * 100) / 100;
	if (fromSplit && difference !== splitDelta) {
		splitDelta = difference;
		io.emit('splitTimeUpdate', { time: splitDelta });
	} else if (!fromSplit && difference !== delta) {
		delta = difference;
		io.emit('timeUpdate', { secondsElapsed: delta });
	}
}

// player functions

exports.addPlayer = (io, data) => {
	players = [];
	for (let i = 0; i < data.players; i++) {
		let playerObj = {
			number: i,
			finished: false,
			time: null,
			estimate: data.est || null,
			class: 'player-time-player-running player-time-running timer-player-wrapper',
			shouldShowSplit: false,
			splitTime: null,
			splitDone: false
		};
		players.push(playerObj);
	}
	io.emit('addPlayer', { players: players });
};

exports.donePlayer = (playerIndex, time, io) => {
	if (players.length === 0) return;

	players[playerIndex].time = delta;
	players[playerIndex].finished = true;

	if (players.every(i => i.finished === true)) {
		lastStopped = Date.now();
		clearInterval(incrementer);
		incrementer = null;
		isRunning = false;
		isReset = 'stopped';
		io.emit('isRunningUpdate', isRunning);
		io.emit('isResetUpdate', isReset);
		players[playerIndex].class = 'player-time-player-stopped timer-player-wrapper';

		if (players.length > 1) {
			isReset = 'disableAfterDone';
		} else {
			isReset = 'stopped';
		}
		io.emit('isResetUpdate', isReset);
		postColor(colorFinished, io);
	}

	players[playerIndex].class = 'player-time-player-stopped timer-player-wrapper';
	io.emit('addPlayer', { players: players });
	io.emit('showPlayerDone', {
		show: true,
		time: time,
		timeToShow: 10000,
		player: playerIndex
	});
};
