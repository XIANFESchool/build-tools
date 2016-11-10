#!/usr/bin/env node

require('babel-polyfill');
require('babel-register')({
	ignore: false,
	only: /build-tools\/lib/
});
require('../lib/index');
