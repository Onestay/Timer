import React, { Component } from 'react'; //eslint-disable-line
import moment from 'moment';
import 'normalize.css';
import './App.css';
import { Link } from 'react-router'; //eslint-disable-line

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      secondsElapsed: 0,
      isRunning: false,
      isReset: 'startup',
      class: 'player-time-player-running player-time-running timer-player-wrapper',
      fontFamily: 'sans serif',
      fontSize: 16
    };
    this.incrementer = null;
  }

  render() {
    return (
      <div className="wrapper">
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
          handleSubmit={this.settingsHandleSubmit.bind(this)}/>
        </div>
      </div>
    );
  }

  settingsHandleChange(event) {
    this.setState({ [event.target.name]: [event.target.value] });
  }

  settingsHandleSubmit(event) {
    event.preventDefault();
    fetch('http://localhost:5555/css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fontSize: this.state.fontSize,
        fontFamily: this.state.fontFamily
      })
    }).catch(console.error);
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
    // check if all players are finished
    player[i].time = time;
    player[i].finished = true;

    if (player.every(elem => elem.finished === true)) {
      this.handleStopClick(true);
      player[i].class = 'player-time-player-stopped player-time-stopped timer-player-wrapper';
    }

    player[i].class = 'player-time-player-stopped player-time-running timer-player-wrapper';
  }

  startCount() {
    this.incrementer = setInterval(() => {
      this.setState({ secondsElapsed: this.state.secondsElapsed + 1 });
    }, 1000);
  }

  postColor(color) {
    fetch('http://localhost:5555/colorChange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: color })
    }).catch(console.error);
  }

  handleStartClick() {
    this.postColor('#03A9F4');
    this.setState({
      secondsElapsed: 1,
      isRunning: true,
      isReset: 'running'
    });
    this.startCount();
  }

  handleStopClick(isFinished) {
    if (isFinished) {
      this.postColor('#4CAF50');
      setTimeout(() => { this.postColor('black'); }, 10000);
    } else {
      this.postColor('#9E9E9E');
    }

    clearInterval(this.incrementer);
    this.setState({
      isRunning: false,
      isReset: 'stopped'
      });
  }

  handleResetClick() {
    fetch('http://localhost:5555/colorChange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: 'black' })
    }).catch(console.error);

    if (this.state.isRunning) return;
    this.setState({
      secondsElapsed: 0,
      isRunning: false,
      isReset: 'startup',
      players: []
    });
  }

  handleResume() {
    this.postColor('#03A9F4');
    this.setState({
      secondsElapsed: this.state.secondsElapsed + 1,
      isRunning: true,
      isReset: 'running'
    });
    this.startCount();
  }

}

class Settings extends Component { //eslint-disable-line 
  render() {
    // not wanting to cope with ANY MORE FUCKING CSS MADE ME USE SO MANY BREAKS. WHY CAN'T CSS JUST DO WHAT YOU WANT IT TO DO
    return (
      <div>
        <form onSubmit={this.props.handleSubmit.bind(this)}>
          <h2>Font</h2>
          <label>
            Font Family
            <input type="text" value={this.props.font} onChange={this.props.handleChange.bind(this)} name="fontFamily"/>
          </label>
          <label>
            Font Size
            <input type="number" value={this.props.size} onChange={this.props.handleChange.bind(this)} name="fontSize"/>
          </label>
          <input type="submit" value="submit" />
        </form>
      </div>
    );
  }
}

class PlayerSetup extends Component { //eslint-disable-line
  render() {
    let players = [];
    for (let i = 0; i < this.props.maxPlayers; i++) {
      players.push(<button key={i} onClick={this.props.isReset === 'startup' ? () => { this.props.onPlayerUpdate(i + 1, 5); } : null } className={this.props.isReset === 'startup' ? 'panel-player-on' : 'panel-player-off'}>Setup {i + 1} {i === 0 ? 'Player' : 'Players'}</button>);
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

    fetch('http://localhost:5555/updateTime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: this.formattedSeconds(this.props.secondsElapsed) })
    }).catch(console.error);

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
              onPlayerDone={this.props.onPlayerDone} playerTime={current.time} class={current.class}/>
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
    return (
      <div className={this.props.class}>
        <h3>Player {this.props.number + 1}</h3>
        <span>{this.props.finished ? this.props.playerTime : this.props.time}</span>
        <button onClick={this.props.finished ? null : () => this.playerDone()}>Done</button>
      </div>
    );
  }
}

function Header() { //eslint-disable-line
  return (
    <div className="header">
      <h1>ESA Germany Timer</h1>
    </div>
  );
}

export default App;
