import path from 'path';
import program from 'commander';
import inquirer from 'inquirer';
import readJson from 'read-package-json';
import os from 'os';
import waitAnimation from './waitAnimation';
import exec from './exec';
import log from './log';
import isSkipNextStep from './isSkipNextStep';

const cmdSep = os.platform() === 'win32' ? ' & ' : '; ';

if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}

//clone repository
function cloneRepository(repository) {
	const spinner = waitAnimation(`step1: clone ${repository} -> %s`, `step1: clone ${repository} -> done`);
	return exec(`git clone ${repository}`, spinner, (resolve) => {
			const dir = path.basename(repository, '.git');
		  resolve(dir);
		}, (reject, stderr) => {
				reject(`the repository ${repository} can not be clone: ${stderr}`);
		});
}

//list branch
function listBranchNames(dir) {
	return exec(`cd ${dir} ${cmdSep} git branch -r`, null, (resolve, stdout) => {
			resolve(stdout);
		}, (reject, stderr) => {
			reject(`list repository ${dir} all branches fail: ${stderr}`)
		});
}

//select branch
function selectBranch(branchNames) {

	const names = branchNames.split('\n');

	const choiceList =
		names.filter(name => name.indexOf('origin/HEAD') == -1 && name.trim() !== '')
			.map(name => {
				name = name.trim();
				return {
					name: name,
					value: name
				};
			});

	return new Promise((resolve, reject) => {
		inquirer.prompt([
				{
					type: 'list',
					name: 'branchName',
					message: 'step2: choose your branch',
					choices: choiceList
				}])
			.then((answers) => {
				resolve(answers.branchName);
			}).catch((err) => {
				reject(err);
			});
	});
}

// check branch
function checkoutSelectedBranch(dir, branchName) {
	const spinner = waitAnimation(`step3: checkout ${branchName} -> %s`, `step3: checkout ${branchName} -> done`);

	return exec(`cd ${dir} ${cmdSep} git checkout ${branchName}`, spinner, (resolve, stdout) => {
			resolve(stdout);
		}, (reject, stderr) => {
			reject(`checkout branch ${branchName} fail: ${stderr}`);
		});
}

// npm install
function npmInstall(dir) {
	const spinner = waitAnimation(`step4: npm install -> %s`, `step4: npm install -> done`);

	return exec(`cd ${dir} ${cmdSep} cnpm install`, spinner, (resolve, stdout) => {
			resolve(stdout);
		}, (reject, stderr) => {
			reject(`npm install fail: ${stderr}`);
		});
}

// list npm scripts
function listNPMScripts(dir) {
	return new Promise((resolve, reject) => {
		readJson(path.join(dir, 'package.json'), console.error, false, function (err, data) {
			if (err) {
				reject(`There was an error reading the file ${err}`);
				return;
			}
			resolve(data.scripts);
		});
	});
}

function selectBuildScript(scripts) {
	const _scripts = Object.keys(scripts);

	const choiceList =
		_scripts.map(name => {
				name = name.trim();
				return {
					name: name,
					value: `npm run ${name}`
				};
			});

	return new Promise((resolve, reject) => {
		inquirer.prompt([
				{
					type: 'list',
					name: 'scriptName',
					message: 'step5: choose your build script',
					choices: choiceList
				}])
			.then((answers) => {
				resolve(answers.scriptName);
			}).catch((err) => {
			reject(err);
		});
	});
}

// npm run build
function npmBuild(dir, script = 'npm run build') {
	const spinner = waitAnimation(`step6: ${script} -> %s`, `step5: ${script} -> done`);

	return exec(`cd ${dir} ${cmdSep} ${script}`, spinner, (resolve, stdout) => {
		resolve(stdout);
	}, (reject, stderr) => {
		reject(`${script} fail: ${stderr}`)
	});
}

function pwd() {
	const pwd = os.platform() === 'win32' ? 'cd' : 'pwd';
	return exec(`${pwd}`, null, (resolve, stdout) => {
		resolve(stdout.trim());
	}, (reject, stderr) => {
		reject(`pwd fail: ${stderr}`)
	});
}

async function startBuild(repository, option) {
	const repositoryName = path.parse(repository).name;
	let dir = '.';
	if (!option) {
		dir = await cloneRepository(repository);
	} else {
		const currentPath = await pwd();
		const paths = currentPath.split(path.sep);
		if (repositoryName !== paths[paths.length-1]) {
			throw Error(`please make sure your location is in ${repositoryName}`);
		}
	}
	const branchNames = await listBranchNames(dir);
	const selectedBranchName = await selectBranch(branchNames);
	await checkoutSelectedBranch(dir, selectedBranchName);

	const isSkipNpmInstall = await isSkipNextStep('is skip step4: npm install ?');

	if(!isSkipNpmInstall) {
		await npmInstall(dir);
	}

	const scripts = await listNPMScripts(dir);
	const script = await selectBuildScript(scripts);

	await npmBuild(dir, script);
}

program
	.version('0.0.1')
	.description(`
	step1: git clone repository
	step2: choose your branch
	step3: git checkout branch
	step4: npm install
	step5: choose your build script
	step6: run build script`);

program
	.command('run <repository> [skip-clone]')
	.description(`

	repository: git repository ssh path,
	skip-clone: skip step1: git clone repository, please make sure your directory is the repository directory.
	 `)
	.action((repository, skipClone) => {
		startBuild(repository, skipClone).then(() => {
			log.info('All Done O(∩_∩)O~ 今晚吃鸡 大吉大利');
			// http://patorjk.com/software/taag/#p=display&f=Graffiti&t=Type%20Something%20
			log.info(`
/***
 *       _____ _                             ______ ______
 *      / ____| |                           |  ____|  ____|
 *     | (___ | |__  _   _ _   _ _   _ _ __ | |__  | |__
 *      \___ \| '_ \| | | | | | | | | | '_ \|  __| |  __|
 *      ____) | | | | |_| | |_| | |_| | | | | |    | |____
 *     |_____/|_| |_|\__,_|\__, |\__,_|_| |_|_|    |______|
 *                          __/ |
 *                         |___/
 */
			`);
		}).catch((err) => {
			log.error(`\n${err}`);
		});
	});

program.parse(process.argv);

// 没有参数时, 输出 help
if (!process.argv.slice(2).length) {
	program.outputHelp();
}
