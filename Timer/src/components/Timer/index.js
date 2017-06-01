import React, {
	Component
} from 'react';

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
			fontSize: 100,
			timerFormat: 'normal'
		};
		this.socket = io();
	}

	componentDidMount() {
		this.socket.on('currentState', (data) => {
			this.setState({
				seconds: data.delta,
				color: data.currentColor,
				timerFormat: data.timerFormat
			});
		});

		this.socket.on('timeUpdate', (data) => {
			this.setState({ seconds: data.secondsElapsed });
		});

		this.socket.on('settings', (data) => {
			this.setState({
				fontFamily: data.fontFamily,
				fontSize: data.fontSize,
				timerFormat: data.timerFormat
			});
		});

		this.socket.on('colorChange', (data) => {
			this.setState({ color: data.color });
		});
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

	render() {
		const normalStyle = {
			fontFamily: this.state.fontFamily,
			fontSize: `${this.state.fontSize}px`,
			color: this.state.color,
			'-webkit-text-stroke': '3px black',
			'font-weight': 'bold'
		};

		const milliStyle = {
			fontFamily: this.state.fontFamily,
			fontSize: `${this.state.fontSize / 1.5}px`,
			color: this.state.color,
			'-webkit-text-stroke': '1.5px black',
			'font-weight': 'bold'
		};

		let seconds = this.formattedSeconds(this.state.seconds);
		let milliseconds = this.formattedMilliseconds(this.state.seconds);
		let dynHours = this.formattedDynHours(this.state.seconds);

		// this set's the var time according to the chosen timer format
		let time;

		if (this.state.timerFormat === 'normal') {
			time = <span style={normalStyle}>{seconds}</span>;
		} else if (this.state.timerFormat === 'milli') {
			time = <div>
                <span style={normalStyle}>{seconds}.</span>
                <span style={milliStyle}>{milliseconds}</span>
            </div>;
		} else if (this.state.timerFormat === 'dynHours') {
			time = <span style={normalStyle}>{dynHours}</span>;
		} else if (this.state.timerFormat === 'dynHoursMilli') {
			time = <div>
                <span style={normalStyle}>{dynHours}.</span>
                <span style={milliStyle}>{milliseconds}</span>
            </div>;
		} else {
			time = <span style={{ color: 'red' }}>Something went horribly wrong...</span>;
		}

		return (
			<div>
                {time}
			</div>
		);
	}
}

export default Timer;
