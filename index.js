#!/usr/bin/env node
'use strict';
const path = require('path');
const program = require('commander');
const exec = require('child_process').exec;
const q = require('q');
const inquirer = require('inquirer');
const Spinner = require('cli-spinner').Spinner;
const chalk = require('chalk');

const
	info = chalk.bold.green,
	error = chalk.bold.red,
	warn = chalk.bold.yellow;

const log = (message) => {
	console.log(message);
};

Object.assign(log, {
	info(message) {
		console.log(info(message));
	},
	error(message) {
		console.log(error(message));
	},
	warn(message) {
		console.log(warn(message));
	}
});

const toString = Object.prototype.toString;

if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}

function waitAnimation(waitTitle, finishTitle) {
	let spinner = new Spinner(waitTitle);
	spinner.setSpinnerString('|/-\\');

	return {
		stop: function(success) {
			if (success) {
				spinner.stop(true);
				log.info(finishTitle);
			} else {
				spinner.stop(false);
			}
		},
		start: function() {
			spinner.start();
		}
	}
}

//clone repository
function cloneRepository(repository) {
	const deferred = q.defer();
	const spinner = waitAnimation(`step1: clone ${repository} -> %s`, `step1: clone ${repository} -> done`);
	spinner.start();
	exec(`git clone ${repository}`, (error, stdout, stderr) => {
		if (error) {
			spinner.stop();
			deferred.reject(`the repository ${repository} can not be clone: ${stderr}`)
		} else {
			const dir = path.basename(repository, '.git');
			spinner.stop(true);
			deferred.resolve(dir);
		}
	});

	return deferred.promise;
}

//list branch
function listBranchNames(dir) {
	const deferred = q.defer();
	exec(`cd ${dir};git branch -r`, (error, stdout, stderr) => {
		if (error) {
			deferred.reject(`list repository ${dir} all branches fail: ${stderr}`)
		} else {
			deferred.resolve(stdout);
		}
	});
	return deferred.promise;
}

//select branch
function selectBranch(branchNames) {
	const names = branchNames.split('\n');
	const deferred = q.defer();

	const choiceList =
		names.filter(name => name.indexOf('origin/HEAD') == -1 && name.trim() !== '')
			.map(name => {
				name = name.trim();
				return {
					name: name,
					value: name
				};
			});

	inquirer.prompt([
			{
				type: 'list',
				name: 'branchName',
				message: 'step2: choose your branch',
				choices: choiceList
			}])
		.then(function (answers) {
			deferred.resolve(answers.branchName);
	});

	return deferred.promise;
}

// check branch
function checkoutSelectedBranch(dir, branchName) {
	const deferred = q.defer();
	const spinner = waitAnimation(`step3: checkout ${branchName} -> %s`, `step3: checkout ${branchName} -> done`);
	spinner.start();
	exec(`cd ${dir}; git checkout ${branchName}`, (error, stdout, stderr) => {
		if (error) {
			spinner.stop();
			deferred.reject(`checkout branch ${branchName} fail: ${stderr}`)
		} else {
			spinner.stop(true);
			deferred.resolve(stdout);
		}
	});
	return deferred.promise;
}

// npm install
function npmInstall(dir) {
	const deferred = q.defer();
	const spinner = waitAnimation(`step4: npm install -> %s`, `step4: npm install -> done`);
	spinner.start();
	exec(`cd ${dir}; npm install`, (error, stdout, stderr) => {
		if (error) {
			spinner.stop();
			deferred.reject(`npm install fail: ${stderr}`)
		} else {
			spinner.stop(true);
			deferred.resolve(stdout);
		}
	});
	return deferred.promise;
}

// npm run build
function npmBuild(dir) {
	const deferred = q.defer();
	const spinner = waitAnimation(`step5: npm run build -> %s`, `step5: npm run build -> done`);
	spinner.start();
	exec(`cd ${dir}; npm run build`, (error, stdout, stderr) => {
		if (error) {
			spinner.stop();
			deferred.reject(`npm run build fail: ${stderr}`)
		} else {
			spinner.stop(true);
			deferred.resolve(stdout);
		}
	});
	return deferred.promise;
}

const startBuild = q.async(function*(repository) {
	let dir = './';
	if (toString.call(repository) === '[object String]') {
		dir = yield cloneRepository(repository);
	}
	const branchNames = yield listBranchNames(dir);
	const selectedBranchName = yield selectBranch(branchNames);
	yield checkoutSelectedBranch(dir, selectedBranchName);
	yield npmInstall(dir);
	yield npmBuild(dir);
});

program
	.version('0.0.1')
	.description(`
		step1: git clone <repository>
		step2: choose your branch
		step3: git checkout <branchName>
		step4: npm install
		step5: npm run build
	`);

program
	.command('run <repository>')
	.description('from step1 to step5: <repository> is your git repository ssh path.')
	.action((repository) => {
		startBuild(repository).done(() => {
			log.info('All Done O(∩_∩)O~');
		}, (err) => {
			log.error(`\n${err}`);
		});
	});

program
	.command('build')
	.description('from step2 to step5: you need jump to project directory before.')
	.action((repository) => {
		startBuild(repository).done(() => {
			log.info('All Done O(∩_∩)O~');
		}, (err) => {
			log.error(`\n${err}`);
		});
	});

program.parse(process.argv);

// 没有参数时, 输出 help
if (!process.argv.slice(2).length) {
	program.outputHelp();
}
