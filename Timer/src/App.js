import React, { Component } from 'react'; //eslint-disable-line
import moment from 'moment';
import 'normalize.css';
import './App.css';
import { Link } from 'react-router'; //eslint-disable-line
import io from 'socket.io-client';

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
      fontSize: 50,
      colorFinished: '#4CAF50',
      colorPaused: '#9E9E9E',
      colorStartup: '#000000',
      colorRunning: '#03A9F4'
    };
    this.incrementer = null;
    this.socket = io('localhost:5555');
    this.socket.on('timeUpdate', (data) => { this.setState({ data }); });
  }

  render() {
    return (
      <div className="wrapper" onKeyDown={this.handleKeyDown.bind(this)}>
        <Header />
        <div className="timer-wrapper">
          <Stopwatch players={this.state.players} onPlayerDone={this.onPlayerDone.bind(this)}
          handleStartClick={this.handleStartClick.bind(this)}
          handleStopClick={this.handleStopClick.bind(this)}
          handleResetClick={this.handleResetClick.bind(this)}
          handleResume={this.handleResume.bind(this)}
          secondsElapsed={this.state.secondsElapsed}
          isRunning={this.state.isRunning}
          isReset={this.state.isReset}/>
        </div>
        <PlayerSetup onPlayerUpdate={this.onPlayerUpdate.bind(this)} isRunning={this.state.isRunning} maxPlayers={4} isReset={this.state.isReset}/>
        <div className="settings-wrapper">
          <Settings size={this.state.fontSize} font={this.state.fontFamily}
          handleChange={this.settingsHandleChange.bind(this)}
          handleSubmit={this.settingsHandleSubmit.bind(this)}
          finished={this.state.colorFinished}
          paused={this.state.colorPaused}
          startup={this.state.colorStartup}
          running={this.state.colorRunning}/>
        </div>
        <button type="button" onClick={this.handleStopClick.bind(this)}>Debug stop</button>
        <button type="button" onClick={this.handleStartClick.bind(this)}>Debug start</button>
        <button type="button" onClick={this.handleResetClick.bind(this)}>Debug reset</button>
        <button type="button" onClick={this.handleResume.bind(this)}>Debug resume</button>

      </div>
    );
  }

  componentDidMount() {
    // not sure if this is "the react way of doing things" but I didn't find anything else
    document.body.addEventListener('keydown', (event) => {
      this.handleKeyDown(event.keyCode);
    });

    this.socket.on('timeUpdate', (data) => {
      console.log(data);
      this.setState({ secondsElapsed: data.secondsElapsed });
    });

    this.socket.on('isRunningUpdate', (data) => {
      this.setState({ isRunning: data });
    });

    this.socket.on('isResetUpdate', (data) => {
      this.setState({ isReset: data });
    });

    this.socket.on('currentState', (data) => {
      if (!this.state.isSetup) {
        this.setState({
        isSetup: true,
        isReset: data.isReset,
        isRunning: data.isRunning,
        secondsElapsed: data.delta
        });
      }
    });
  }

  componentWillUnmount() {
    // dunno if this is necessary but... eh
    document.body.removeEventListener('keydown');
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

  settingsHandleChange() {
    this.setState({ [event.target.name]: [event.target.value] });
  }

  settingsHandleSubmit() {
    event.preventDefault();
  }

  onPlayerUpdate(index, est) {
    this.setState({ players: [] });
    let tempArr = [];
    for (let i = 0; i < index; i++) {
      let playerObj = {
        number: i,
        finished: false,
        time: null,
        estimate: est || null,
        class: 'player-time-player-running player-time-running timer-player-wrapper'
      };

      tempArr.push(playerObj);
    }
    this.setState({ players: tempArr });
    tempArr = [];
  }

  onPlayerDone(i, time) {
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
  }


  handleStartClick() {
    fetch('http://localhost:5555/startTimer');
  }

  handleStopClick() {
    fetch('http://localhost:5555/stopTimer');
  }

  handleResetClick() {
    fetch('http://localhost:5555/resetTimer');
  }

  handleResume() {
    fetch('http://localhost:5555/resumeTimer');
  }

}

/* eslint-disable no-trailing-spaces */
class Settings extends Component { //eslint-disable-line 
  render() {
    // please don't kill me for the styling of this form
    // I'm honestly extremely sorry for any web designer looking at this code
    // I know that this is extremely shit. FORGIVE ME
    // WutFace
    return (
      <div>
      <h2>Settings</h2>
        <form onSubmit={this.props.handleSubmit.bind(this)}>
          <h3>Font</h3>
          <label>
            Font Family:&nbsp;
            <input type="text" value={this.props.font} onChange={this.props.handleChange.bind(this)} name="fontFamily"/>
          </label>
          <br />
          <label>
            Font Size:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <input type="number" value={this.props.size} onChange={this.props.handleChange.bind(this)} name="fontSize" />
          </label>
          <h3>Colors</h3>
          <label>Finished:&nbsp;<input type="color" name="colorFinished" value={this.props.finished} onChange={this.props.handleChange.bind(this)}/></label>
          &nbsp;&nbsp;&nbsp;<label>Paused:&nbsp;&nbsp;<input type="color" name="colorPaused" value={this.props.paused} onChange={this.props.handleChange.bind(this)}/></label>
          <br />
          <label>Startup:&nbsp;&nbsp;&nbsp;<input type="color" name="colorStartup" value={this.props.startup} onChange={this.props.handleChange.bind(this)}/></label>
          &nbsp;&nbsp;&nbsp;<label>Running:&nbsp;<input type="color" name="colorRunning" value={this.props.running} onChange={this.props.handleChange.bind(this)}/></label>
          <input type="submit" value="submit" />
        </form>
      </div>
    );
  }
/* eslint-enable no-trailing-spaces */
}

class PlayerSetup extends Component { //eslint-disable-line
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


class Stopwatch extends Component { //eslint-disable-line
  formattedSeconds(sec) {
    return (
      moment().startOf('day')
              .second(sec)
              .format('H:mm:ss')
    );
  }

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
        buttonCase = <button className="timer-btn-start" onClick={() => this.props.handleStartClick()}>Start</button>;
        break;
      default:
        buttonCase = <button className="timer-btn-stop">ERROR</button>;
        break;
    }


    return (
      <div>
        <div className="timer-master">
          <h2>Master Timer</h2>
          {buttonCase}
          <button onClick={() => this.props.handleResetClick()} className={this.props.isRunning ? 'timer-btn-reset-off' : 'timer-btn-reset'}>Reset</button>
          <span className='time-time'>{this.formattedSeconds(this.props.secondsElapsed)}</span>
        </div>
        <div className="timer-player">
          {this.props.players.map((current) => {
            return (
              <Players key={current.number} number={current.number} est={current.est} finished={current.finished} time={this.formattedSeconds(this.props.secondsElapsed)}
              onPlayerDone={this.props.onPlayerDone} playerTime={current.time} class={current.class} isReset={this.props.isReset}/>
            );
          })}
        </div>
      </div>
    );
  }
}

class Players extends Component { //eslint-disable-line
  playerDone() {
    let time = this.props.time;
    this.props.onPlayerDone(this.props.number, time);
  }

  getCurrentTime() {
    return this.props.time;
  }

  render() {
    let onClickFunction;
    if (this.props.isReset === 'startup' || this.props.finished) {
      onClickFunction = null;
    } else {
      onClickFunction = () => this.playerDone();
    }
    return (
      <div className={this.props.class}>
        <h3>Player {this.props.number + 1}</h3>
        <span>{this.props.finished ? this.props.playerTime : this.props.time}</span>
        <button onClick={onClickFunction}>Done</button>
      </div>
    );
  }
}

function Header() { //eslint-disable-line
  return (
    <div className="header">
      <h1>ESA Germany Timer</h1>
      <span>made by Onestay</span>
    </div>
  );
}


export default App;
