'use strict';

const bcrypt = require('bcryptjs');
const password = 'thinkful';

/* Hash a password with cost-factor 10, then run compare to verify */
bcrypt.hash(password, 10)
	.then(digest => {
		console.log('digest:', digest);
		return digest;
	})
	.then(hash => {
		return bcrypt.compare(password, hash);
	})
	.then(valid => {
		console.log('isValid: ', valid);
	})
	.catch(err => {
		console.error('error', err);
	});