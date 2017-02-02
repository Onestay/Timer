import React, { Component } from 'react';

// other libs
import io from 'socket.io-client'; //eslint-disable-line

// the flag animation
import flag from './img/flag.gif';

// css
import './style.css';

class Player extends Component {
	constructor(props) {
		super(props);
		this.state = {
			player: this.props.location.query.player || '0',
			color: '#4CAF50',
			show: false,
			time: '0:00:00'
		};
		this.socket = io('localhost:5555');
	}

	componentDidMount() {
		this.socket.on('currentState', (data) => {
			this.setState({ color: data.colorFinished });
		});
		// for some weird reason while using arrow functions this was bound to the wrong thing
		this.socket.on('showPlayerDone', function(data) { //eslint-disable-line
			if (data.player.toString() === this.state.player) {
				this.setState({
					show: data.show,
					time: data.time
				});
			}
		}.bind(this));

		this.socket.on('isResetUpdate', function(data) { //eslint-disable-line
			if (data === 'startup') {
				this.setState({ show: false });
			}
		}.bind(this));
	}

	render() {
		let colorStyle = { color: this.state.color };
		let shouldBeShowed = { display: this.state.show ? 'block' : 'none' };
		return (
			<div style={shouldBeShowed}>
				<img src={flag} alt="finish flag" />
				<span className="player-time" style={colorStyle}>{this.state.time}</span>
			</div>
		);
	}
}

export default Player;
