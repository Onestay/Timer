import React from 'react';
import {
	Router,
	Route,
	browserHistory
} from 'react-router';

// Components
import App from './components/Dashboard';
import NoAccess from './components/NoAccess';
import Players from './components/Players';
import Timer from './components/Timer';

const correctKey = (nextState, replace, callback) => {
	fetch('/validateKey', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: window.location.href })
		}).then((data) => {
			if (data.status === 200) {
				replace('/nope');
				console.log('wrong key');
			}
			callback();
		})
		.catch(error => {
			console.log(error);
			replace('/nope');
			callback(error);
		});
};

// eslint-disable-next-line
const routes = (
	<Router history={browserHistory}>
    <Route path="/nope" component={NoAccess} />
    <Route path="/players" component={Players} onEnter={correctKey}/>
    <Route path="/timer" component={Timer} onEnter={correctKey} />
    <Route path="*" onEnter={correctKey} component={App}/>
	</Router>
);

export default routes;
