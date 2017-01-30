// react
import React, { Component } from 'react';

// other libs
import moment from 'moment';
import io from 'socket.io-client';
import Alert from 'react-s-alert';

// css
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
      secondsElapsed: 0,
      isRunning: false,
      isReset: 'startup',
      class: 'player-time-player-running player-time-running timer-player-wrapper',
      fontFamily: 'Arial',
      fontSize: 100,
      colorFinished: '#4CAF50',
      colorPaused: '#9E9E9E',
      colorStartup: '#000000',
      colorRunning: '#03A9F4'
    };
    this.incrementer = null;
    this.socket = io('localhost:5555');
    this.socket.on('timeUpdate', (data) => { this.setState({ data }); });
    this.time = this.formattedSeconds(this.state.secondsElapsed);
  }

  render() {
    this.time = this.formattedSeconds(this.state.secondsElapsed);
    return (
      <div className="wrapper" onKeyDown={this.handleKeyDown.bind(this)}>
        <Header />
        <div className="timer-wrapper">
          <Stopwatch players={this.state.players} onPlayerDone={this.onPlayerDone.bind(this)}
          handleStartClick={this.handleStartClick.bind(this)}
          handleStopClick={this.handleStopClick.bind(this)}
          handleResetClick={this.handleResetClick.bind(this)}
          handleResume={this.handleResume.bind(this)}
          seconds={this.time}
          isRunning={this.state.isRunning}
          isReset={this.state.isReset}/>
        </div>
        <PlayerSetup onPlayerUpdate={this.onPlayerUpdate.bind(this)} isRunning={this.state.isRunning} maxPlayers={4} isReset={this.state.isReset}/>
        <div className="settings-wrapper">
          <Settings size={this.state.fontSize} font={this.state.fontFamily}
          finished={this.state.colorFinished}
          paused={this.state.colorPaused}
          startup={this.state.colorStartup}
          running={this.state.colorRunning}
          updateState={this.updateState.bind(this)}
          submitSettings={this.submitSettings.bind(this)}/>
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
        colorRunning: data.colorRunning
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
        colorStartup: data.colorStartup
      });
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
    return (
      moment().startOf('day')
              .second(sec)
              .format('H:mm:ss')
    );
  }

  handleKeyDown(key) {
    switch (key) {
      case 77 : this.onPlayerDone(0, this.formattedSeconds(this.state.secondsElapsed)); break;
      case 78 : this.onPlayerDone(1, this.formattedSeconds(this.state.secondsElapsed)); break;
      case 66 : this.onPlayerDone(2, this.formattedSeconds(this.state.secondsElapsed)); break;
      case 86 : this.onPlayerDone(3, this.formattedSeconds(this.state.secondsElapsed)); break;
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
    /*
    if (this.state.players.length === 0) return;
    const player = this.state.players;
    player[i].time = time;
    player[i].finished = true;

    let playerPosition = () => { //eslint-disable-line
      let count = 0;
      this.state.players.forEach((value) => {
        if (value.finished === true) {
          count++;
        }
      });
      return count;
    };

    // check if all players are finished
    if (player.every(elem => elem.finished === true)) {
      this.handleStopClick(true);
      player[i].class = 'player-time-player-stopped player-time-stopped timer-player-wrapper';
    }

    player[i].class = 'player-time-player-stopped player-time-running timer-player-wrapper';
    */
    fetch('http://localhost:5555/donePlayer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: i })
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
    this.setState({ [key]: [value] });
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
        colorRunning: this.state.colorRunning
      })
    });
  }

}

class Settings extends Component {
  render() {
    // I'm honestly extremely sorry for any web designer looking at the styling of this form
    return (
      <div>
      <h2>Settings</h2>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <h3>Font</h3>
          <label>
            Font Family:&nbsp;
            <input type="text" value={this.props.font} onChange={this.handleChange.bind(this)} name="fontFamily"/>
          </label>
          <br />
          <label>
            Font Size:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <input type="number" value={this.props.size} onChange={this.handleChange.bind(this)} name="fontSize" />
          </label>
          <h3>Colors</h3>
          <label>Finished:&nbsp;<input type="color" name="colorFinished" value={this.props.finished} onChange={this.handleChange.bind(this)}/></label>
          &nbsp;&nbsp;&nbsp;<label>Paused:&nbsp;&nbsp;<input type="color" name="colorPaused" value={this.props.paused} onChange={this.handleChange.bind(this)}/></label>
          <br />
          <label>Startup:&nbsp;&nbsp;&nbsp;<input type="color" name="colorStartup" value={this.props.startup} onChange={this.handleChange.bind(this)}/></label>
          &nbsp;&nbsp;&nbsp;<label>Running:&nbsp;<input type="color" name="colorRunning" value={this.props.running} onChange={this.handleChange.bind(this)}/></label>
          <input type="submit" value="submit" />
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
        <button key={i} onClick={this.props.isReset === 'startup' ? () => { this.props.onPlayerUpdate(i + 1, 5); } : null } className={this.props.isReset === 'startup' ? 'panel-player-on' : 'panel-player-off'}>Setup {i + 1} {i === 0 ? 'Player' : 'Players'}</button>
      );
    }
    return (
      <div className="panel">
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
        buttonCase = <button className="timer-btn-stop" onClick={() => this.props.handleStopClick()}>Stop</button>;
        break;
      case 'stopped':
        buttonCase = <button className="timer-btn-stop" onClick={() => this.props.handleResume()}>Resume</button>;
        break;
      case 'startup':
        buttonCase = <button className={this.props.players.length === 0 ? 'timer-btn-disable' : 'timer-btn-start'} onClick={this.props.players.length === 0 ? null : () => { this.props.handleStartClick(); }}>Start</button>;
        break;
      default:
        buttonCase = <button className="timer-btn-stop">ERROR</button>;
        break;
      case 'disableAfterDone':
        buttonCase = <button className="timer-btn-disable">Resume</button>;
        break;
    }


    return (
      <div>
        <div className="timer-master">
          <h2>Master Timer</h2>
          {buttonCase}
          <button onClick={this.props.isRunning ? null : () => this.props.handleResetClick()} className={this.props.isRunning ? 'timer-btn-reset-off' : 'timer-btn-reset'}>Reset</button>
          <span className='time-time'>{this.props.seconds}</span>
        </div>
        <div className="timer-player">
          {this.props.players.map((current) => {
            return (
              <Players key={current.number} number={current.number} est={current.est} finished={current.finished} time={this.props.seconds}
              onPlayerDone={this.props.onPlayerDone} playerTime={current.time} class={current.class} isReset={this.props.isReset} onPlayerResume={this.props.onPlayerResume}/>
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

    if (this.props.isReset === 'startup' || this.props.finished) {
      button = <button onClick={null} className="player-button-disable">Done</button>;
    } else if (!this.props.finished) {
      button = <button onClick={() => this.props.onPlayerDone(this.props.number)} className="player-button-enable">Done</button>;
    }
/*
I don't really see any sense for resuming a single player. I will still leave it here in case it's needed later
    } else if (this.props.finished) {
      button = <button onClick={() => this.props.onPlayerResume(this.props.number)} className="player-button-resume">Resume</button>;
    }
*/
    return (
      <div className={this.props.class}>
        <h3>Player {this.props.number + 1}</h3>
        <span>{this.props.finished ? this.props.playerTime : this.props.time}</span>
        {button}
      </div>
    );
  }
}

function Header() {
  return (
    <div className="header">
      <h1>ESA Germany Timer</h1>
      <span>made with &#10084; and code by Onestay</span>
    </div>
  );
}


export default App;
