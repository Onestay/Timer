// react
import React, {
	Component
} from 'react';

// other libs
import moment from 'moment';
import 'moment-duration-format';
import io from 'socket.io-client';
import Alert from 'react-s-alert';

// css
import 'bootstrap/dist/css/bootstrap.css';
import 'normalize.css';
import './style.css';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isSetup: false,
			players: [],
			secondsElapsed: 3600,
			isRunning: false,
			isReset: 'startup',
			class: 'player-time-player-running player-time-running timer-player-wrapper',
			fontFamily: 'Arial',
			fontSize: 150,
			colorFinished: '#4CAF50',
			colorPaused: '#9E9E9E',
			colorStartup: '#000000',
			colorRunning: '#03A9F4',
			timerFormat: 'normal',
			time: '0:00:00',
			milliTime: '0:00:00.00',
			dynHoursTime: '00:00',
			splitTime: '',
			splitRunning: false
		};
		this.incrementer = null;
		this.socket = io('localhost:5555');
	}

	render() {
		this.state.time = this.formattedSeconds(this.state.secondsElapsed);
		this.state.milliTime = this.formattedMilliseconds(this.state.secondsElapsed);
		this.state.dynHoursTime = this.formattedDynHours(this.state.secondsElapsed);
		return (
			<div className="wrapper" onKeyDown={this.handleKeyDown.bind(this)}>
        <Header />
        <div className="timer-wrapper">
          <Stopwatch
          players={this.state.players}
          handleSplitClick={this.handleSplitClick.bind(this)}
          onPlayerDone={this.onPlayerDone.bind(this)}
          handleStartClick={this.handleStartClick.bind(this)}
          handleStopClick={this.handleStopClick.bind(this)}
          handleResetClick={this.handleResetClick.bind(this)}
          handleResume={this.handleResume.bind(this)}
          handleSplitStopClick={this.handleSplitStopClick.bind(this)}
          seconds={this.state.time}
          isRunning={this.state.isRunning}
          isReset={this.state.isReset}
          splitTime={this.state.splitTime}
          splitRunning={this.state.splitRunning}
          />
        </div>
        <div className="sidebar-wrapper">
          <PlayerSetup onPlayerUpdate={this.onPlayerUpdate.bind(this)} isRunning={this.state.isRunning} maxPlayers={4} isReset={this.state.isReset}/>
          <div className="settings-wrapper" id="settings">
            <Settings size={this.state.fontSize} font={this.state.fontFamily}
            finished={this.state.colorFinished}
            paused={this.state.colorPaused}
            startup={this.state.colorStartup}
            running={this.state.colorRunning}
            updateState={this.updateState.bind(this)}
            submitSettings={this.submitSettings.bind(this)}
            time={this.state.time}
            milliTime={this.state.milliTime}
            timerFormat={this.state.timerFormat}
            dynHoursTime={this.state.dynHoursTime}
            />
          </div>
        </div>
        <Alert stack={{ limit: 2 }} />
      </div>
		);
	}

	componentDidMount() {
		document.body.addEventListener('keydown', (event) => {
			this.handleKeyDown(event.keyCode);
		});

		this.socket.on('timeUpdate', (data) => {
			this.setState({ secondsElapsed: data.secondsElapsed });
		});

		this.socket.on('isRunningUpdate', (data) => {
			this.setState({ isRunning: data });
		});

		this.socket.on('isResetUpdate', (data) => {
			this.setState({ isReset: data });
		});

		this.socket.on('currentState', (data) => {
			let players = data.players;
			for (let i = 0; i < players.length; i++) {
				if (players[i].finished) {
					players[i].time = this.formattedSeconds(players[i].time);
				}
			}

			if (!this.state.isSetup) {
				this.setState({
					isSetup: true,
					isReset: data.isReset,
					isRunning: data.isRunning,
					secondsElapsed: data.delta,
					players: players,
					fontFamily: data.fontFamily,
					fontSize: data.fontSize,
					colorFinished: data.colorFinished,
					colorStartup: data.colorStartup,
					colorPaused: data.colorPaused,
					colorRunning: data.colorRunning,
					timerFormat: data.timerFormat
				});
			}
		});

		this.socket.on('addPlayer', (data) => {
			let players = data.players;

			for (let i = 0; i < players.length; i++) {
				if (players[i].finished) {
					players[i].time = this.formattedSeconds(players[i].time);
				}
			}

			this.setState({ players: players });
		});

		this.socket.on('connect_error', () => {
			this.alertMessage('Couldn\'t connect to the websocket. Make sure the backend server is configured correctly.');
		});

		this.socket.on('connect', () => {
			this.alertMessage('Connected to websocket.', 'success');
		});

		this.socket.on('settings', (data) => {
			this.setState({
				fontFamily: data.fontFamily,
				fontSize: data.fontSize,
				colorFinished: data.colorFinished,
				colorPaused: data.colorPaused,
				colorRunning: data.colorRunning,
				colorStartup: data.colorStartup,
				timerFormat: data.timerFormat
			});
		});

		this.socket.on('splitTimeUpdate', (data) => {
			let format = moment.duration(data.time, 'seconds').format('mm:ss', { trim: 'right' });
			this.setState({ splitTime: format });
		});

		this.socket.on('splitRunningUpdate', (data) => {
			this.setState({ splitRunning: data.splitRunning });
		});
	}

	componentWillUnmount() {
		// dunno if this is necessary but... eh
		document.body.removeEventListener('keydown');
	}

	alertMessage(message, event) {
		if (!event) {
			Alert.error(message, {
				position: 'top-left',
				effect: 'slide',
				timeout: 4000
			});
		} else if (event === 'success') {
			Alert.success(message, {
				position: 'top-left',
				effect: 'slide',
				timeout: 4000
			});
		}
	}

	formattedSeconds(sec) {
		return moment.duration(sec, 'seconds').format('H:mm:ss', { trim: false });
	}

	formattedMilliseconds(sec) {
		return moment.duration(sec, 'seconds').format('S', { trim: false })
			.toString()
			.substr(-3, 2);
	}

	formattedDynHours(sec) {
		if (sec >= 3600) {
			return moment.duration(sec, 'seconds').format('H:mm:ss', { trim: false });
		} else {
			return moment.duration(sec, 'seconds').format('mm:ss', { trim: false });
		}
	}

	handleKeyDown(key) {
		switch (key) {
			case 77:
				this.onPlayerDone(0, this.formattedSeconds(this.state.secondsElapsed));
				break;
			case 78:
				this.onPlayerDone(1, this.formattedSeconds(this.state.secondsElapsed));
				break;
			case 66:
				this.onPlayerDone(2, this.formattedSeconds(this.state.secondsElapsed));
				break;
			case 86:
				this.onPlayerDone(3, this.formattedSeconds(this.state.secondsElapsed));
				break;
		}
	}

	onPlayerUpdate(index, est) {
		fetch('http://localhost:5555/addPlayer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				players: index,
				est: est
			})
		});
	}

	onPlayerDone(i) {
		let time;
		switch (this.state.timerFormat) {
			case 'normal':
				time = this.state.time;
				break;
			case 'milli':
				time = `${this.state.time}.${this.state.milliTime}`;
				break;
			case 'dynHours':
				time = this.state.dynHoursTime;
				break;
			case 'dynHoursMilli':
				time = `${this.state.dynHoursTime}.${this.state.milliTime}`;
				break;
		}
		fetch('http://localhost:5555/donePlayer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				index: i,
				time: time
			})
		});
	}

	handleSplitClick(i) {
		fetch('http://localhost:5555/split', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ player: i })
		});
	}

	handleSplitStopClick(i) {
		fetch('http://localhost:5555/splitStop', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ player: i })
		});
	}

	handleStartClick() {
		fetch('http://localhost:5555/startTimer').catch((e) => {
				this.alertMessage(`Couldn't connect to backend server. Error: ${e.message}`);
			})
			.then((data) => {
				if (!data.ok) {
					this.alertMessage(`Error: ${data.statusText}. More info in the console.`);
					console.log(data);
				}
			});
	}

	handleStopClick() {
		fetch('http://localhost:5555/stopTimer').catch((e) => {
				this.alertMessage(`Couldn't connect to backend server. Error: ${e.message}`);
			})
			.then((data) => {
				if (!data.ok) {
					this.alertMessage(`Error: ${data.statusText}. More info in the console.`);
					console.log(data);
				}
			});
	}

	handleResetClick() {
		fetch('http://localhost:5555/resetTimer').catch((e) => {
				this.alertMessage(`Couldn't connect to backend server. Error: ${e.message}`);
			})
			.then((data) => {
				if (!data.ok) {
					this.alertMessage(`Error: ${data.statusText}. More info in the console.`);
					console.log(data);
				}
			});
	}

	handleResume() {
		fetch('http://localhost:5555/resumeTimer').catch((e) => {
				this.alertMessage(`Couldn't connect to backend server. Error: ${e.message}`);
			})
			.then((data) => {
				if (!data.ok) {
					this.alertMessage(`Error: ${data.statusText}. More info in the console.`);
					console.log(data);
				}
			});
	}

	updateState(key, value) {
		let stateObject = () => {
			let returnObj = {};
			returnObj[key] = value;
			return returnObj;
		};

		this.setState(stateObject);
	}

	submitSettings() {
		fetch('http://localhost:5555/updateSettings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fontFamily: this.state.fontFamily,
				fontSize: this.state.fontSize,
				colorFinished: this.state.colorFinished,
				colorPaused: this.state.colorPaused,
				colorStartup: this.state.colorStartup,
				colorRunning: this.state.colorRunning,
				timerFormat: this.state.timerFormat
			})
		});
	}

}

class Settings extends Component {
	render() {
		return (
			<div>
      <h2>Settings</h2>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <h3>Font</h3>
          <div className="form-group">
            <label>
              Font Family:
              <input type="text" value={this.props.font} onChange={this.handleChange.bind(this)} name="fontFamily" className="form-control"/>
            </label>
          </div>
          <div className="form-group">
            <label>
              Font Size:
              <input type="number" value={this.props.size} onChange={this.handleChange.bind(this)} name="fontSize" className="form-control"/>
            </label>
          </div>
          <h3>Colors</h3>
          <div className="container">
            <div className="row">
              <div className="col">
                <label>Finished:<input type="color" name="colorFinished" value={this.props.finished} onChange={this.handleChange.bind(this)} className="form-control"/></label>
              </div>
              <div className="col">
                <label>Paused:<input type="color" name="colorPaused" value={this.props.paused} onChange={this.handleChange.bind(this)} className="form-control"/></label>
              </div>
              <div className="col">
                  <label>Startup:<input type="color" name="colorStartup" value={this.props.startup} onChange={this.handleChange.bind(this)} className="form-control"/></label>
              </div>
              <div className="col">
                  <label>Running:<input type="color" name="colorRunning" value={this.props.running} onChange={this.handleChange.bind(this)} className="form-control"/></label>
              </div>
            </div>
          </div>
          <h3>Timer Format</h3>
          <div className="form-check form-check-inline">
            <label className="from-check-label">
              <input type="radio" name="timerFormat" value="normal" onChange={this.handleChange.bind(this)} checked={this.props.timerFormat === 'normal'}/>
              {this.props.time}
            </label>
          </div>
          <div className="form-check form-check-inline">
            <label className="from-check-label">
              <input type="radio" name="timerFormat" value="milli" onChange={this.handleChange.bind(this)} checked={this.props.timerFormat === 'milli'}/>
              {`${this.props.time}.${this.props.milliTime}`}
            </label>
          </div>
          <div className="form-check form-check-inline">
            <label className="from-check-label">
              <input type="radio" name="timerFormat" value="dynHours" onChange={this.handleChange.bind(this)} checked={this.props.timerFormat === 'dynHours'}/>
              {this.props.dynHoursTime}
            </label>
          </div>
          <div className="form-check form-check-inline">
            <label className="from-check-label">
              <input type="radio" name="timerFormat" value="dynHoursMilli" onChange={this.handleChange.bind(this)} checked={this.props.timerFormat === 'dynHoursMilli'}/>
              {`${this.props.dynHoursTime}.${this.props.milliTime}`}
            </label>
          </div>
          <input type="submit" value="Submit" className="btn btn-primary" style={{ display: 'block' }}/>
        </form>
      </div>
		);
	}

	handleChange(event) {
		this.props.updateState(event.target.name, event.target.value);
	}

	handleSubmit(event) {
		event.preventDefault();
		this.props.submitSettings(event);
	}
}

class PlayerSetup extends Component {
	render() {
		let players = [];
		for (let i = 0; i < this.props.maxPlayers; i++) {
			players.push(
				<button key={i} onClick={this.props.isReset === 'startup' ? () => { this.props.onPlayerUpdate(i + 1, 5); } : null } className={this.props.isReset === 'startup' ? 'btn btn-primary button-margin' : 'btn btn-primary disabled button-margin'}>Setup {i + 1} {i === 0 ? 'Player' : 'Players'}</button>
			);
		}
		return (
			<div className="panel" id="player-setup">
        <h2>Player Setup</h2>
        {players}
      </div>
		);
	}
}


class Stopwatch extends Component {
	render() {
		let buttonCase;

		switch (this.props.isReset) {
			case 'running':
				buttonCase = <button className="btn btn-danger btn-lg" onClick={() => this.props.handleStopClick()}>Stop</button>;
				break;
			case 'stopped':
				buttonCase = <button className="btn btn-danger btn-lg" onClick={() => this.props.handleResume()}>Resume</button>;
				break;
			case 'startup':
				buttonCase = <button className={this.props.players.length === 0 ? 'btn btn-success disabled btn-lg' : 'btn btn-success btn-lg'} onClick={this.props.players.length === 0 ? null : () => { this.props.handleStartClick(); }}>Start</button>;
				break;
			default:
				buttonCase = <button className="btn btn-danger btn-lg">ERROR</button>;
				break;
			case 'disableAfterDone':
				buttonCase = <button className="timer-btn-disable btn-lg">Resume</button>;
				break;
		}


		return (
			<div>
        <div className="timer-master">
          <h2>Master Timer</h2>
          {buttonCase}
          <button onClick={this.props.isRunning ? null : () => this.props.handleResetClick()} className={this.props.isRunning ? 'btn btn-warning disabled btn-lg' : 'btn btn-warning btn-lg'}>Reset</button>
          <span className='time-time'>{this.props.seconds}</span>
        </div>
        <div className="timer-player">
          {this.props.players.map((current) => {
            return (
              <Players
              players={this.props.players}
              key={current.number}
              shouldShowSplit={current.shouldShowSplit}
              number={current.number}
              est={current.est}
              finished={current.finished}
              time={this.props.seconds}
              onPlayerDone={this.props.onPlayerDone}
              handleSplitClick={this.props.handleSplitClick}
              playerTime={current.time}
              class={current.class}
              isReset={this.props.isReset}
              onPlayerResume={this.props.onPlayerResume}
              splitTime={this.props.splitTime}
              splitPlayerTime={current.splitTime}
              splitRunning={this.props.splitRunning}
              splitDone={current.splitDone}
              handleSplitStopClick={this.props.handleSplitStopClick}
              />
            );
          })}
        </div>
      </div>
		);
	}
}

class Players extends Component {
	playerDone() {
		this.props.onPlayerDone(this.props.number);
	}

	render() {
		let button;
		let splitButton;
		let splitTime;

		// set the current state for the done button
		if (this.props.isReset === 'startup' || this.props.finished) {
			button = <button onClick={null} className="btn btn-primary btn-sm disabled">Done</button>;
		} else if (!this.props.finished) {
			button = <button onClick={() => this.props.onPlayerDone(this.props.number)} className="btn btn-primary btn-sm">Done</button>;
		}

		// set the current state for the split button
		if (this.props.players.length === 1) {
			splitButton = <span/>;
		} else if (this.props.isReset === 'startup' || this.props.finished) {
			splitButton = <button onClick={null} className="btn btn-success btn-sm disabled">Start Split</button>;
		} else if (!this.props.splitRunning) {
			splitButton = <button onClick={() => this.props.handleSplitClick(this.props.number)} className="btn btn-success btn-sm">Start Split</button>;
		} else if (this.props.splitRunning) {
			splitButton = <button onClick={() => this.props.handleSplitStopClick(this.props.number)} className="btn btn-danger btn-sm">Split</button>;
		}

		if (!this.props.splitRunning) {
			splitTime = <span/>;
		} else if (this.props.splitRunning && this.props.shouldShowSplit && !this.props.splitDone) {
			splitTime = <span>+{this.props.splitTime}</span>;
		} else if (this.props.splitDone) {
			splitTime = <span>+{moment.duration(this.props.splitPlayerTime, 'seconds').format('mm:ss', { trim: false })}</span>;
		}

		return (
			<div className={this.props.class}>
        <h3>Player {this.props.number + 1}</h3>
        <span>{this.props.finished ? this.props.playerTime : this.props.time}</span>
        {button}
        {splitButton}
        {splitTime}
      </div>
		);
	}
}

function Header() {
	return (
		<div className="header">
      <h1>ESA Germany Timer</h1>
      <small className="text-muted">made with &#10084; and code by Onestay</small>
    </div>
	);
}

export default App;
