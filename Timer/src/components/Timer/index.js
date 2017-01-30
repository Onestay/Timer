import React, { Component } from 'react';

import io from 'socket.io-client'; //eslint-disable-line
import moment from 'moment';
import 'moment-duration-format';

import 'normalize.css';

class Timer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			seconds: 0,
			milliseconds: 0,
			fontFamily: 'Arial',
			color: '#000000',
			fontSize: 100
		};
		this.socket = io('localhost:5555');
	}

	componentDidMount() {
		this.socket.on('currentState', (data) => {
			this.setState({ seconds: data.delta });
		});

		this.socket.on('timeUpdate', (data) => {
			this.setState({ seconds: data.secondsElapsed });
		});

		this.socket.on('settings', (data) => {
			this.setState({
				fontFamily: data.fontFamily,
				fontSize: data.fontSize
			});
		});

		this.socket.on('colorChange', (data) => {
			this.setState({ color: data.color });
		});
	}


	formatSeconds(sec) {
		return moment.duration(sec, 'seconds').format('H:mm:ss', { trim: false });
	}

	appendMilliseconds(sec) {
		return moment.duration(sec, 'seconds').format('S', { trim: true })
		.toString()
		.substr(-3, 2);
	}

	render() {
		let style = {
			fontFamily: this.state.fontFamily,
			fontSize: this.state.fontSize,
			color: this.state.color
		};

		let millisecondsStyle = {
			fontFamily: this.state.fontFamily,
			fontSize: this.state.fontSize / 1.5,
			color: this.state.color
		};

		let time = this.formatSeconds(this.state.seconds);
		let milliseconds = this.appendMilliseconds(this.state.seconds);
		let kek; //eslint-disable-line
		return (
			<div>
				<span style={style}>{time}.</span>
				<span style={millisecondsStyle}>{milliseconds}</span>
			</div>
		);
	}
}

export default Timer;
