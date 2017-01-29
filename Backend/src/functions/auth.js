const url = require('url');

let key = '123';
exports.validateKey = (urlToValidate) => {
	return new Promise((resolve) => {
		const urlParts = url.parse(urlToValidate, true);
		const query = urlParts.query;
		if (!query || query.key !== key) {
			resolve(false);
		} else if (query.key === key) {
			resolve(true);
		} else {
			resolve(false);
		}
	});
};