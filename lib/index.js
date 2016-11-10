import path from 'path';
import program from 'commander';
import inquirer from 'inquirer';
import waitAnimation from './waitAnimation';
import exec from './exec';
import log from './log';

const toString = Object.prototype.toString;

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
	return exec(`cd ${dir};git branch -r`, null, (resolve, stdout) => {
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

	return exec(`cd ${dir}; git checkout ${branchName}`, spinner, (resolve, stdout) => {
			resolve(stdout);
		}, (reject, stderr) => {
			reject(`checkout branch ${branchName} fail: ${stderr}`);
		});
}

// npm install
function npmInstall(dir) {
	const spinner = waitAnimation(`step4: npm install -> %s`, `step4: npm install -> done`);

	return exec(`cd ${dir}; npm install`, spinner, (resolve, stdout) => {
			resolve(stdout);
		}, (reject, stderr) => {
			reject(`npm install fail: ${stderr}`);
		});
}

// npm run build
function npmBuild(dir) {
	const spinner = waitAnimation(`step5: npm run build -> %s`, `step5: npm run build -> done`);

	return exec(`cd ${dir}; npm run build`, spinner, (resolve, stdout) => {
		resolve(stdout);
	}, (reject, stderr) => {
		reject(`npm run build fail: ${stderr}`)
	});
}

async function startBuild(repository) {
	let dir = './';
	if (toString.call(repository) === '[object String]') {
		dir = await cloneRepository(repository);
	}
	const branchNames = await listBranchNames(dir);
	const selectedBranchName = await selectBranch(branchNames);
	await checkoutSelectedBranch(dir, selectedBranchName);
	await npmInstall(dir);
	await npmBuild(dir);
}

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
		startBuild(repository).then(() => {
			log.info('All Done O(∩_∩)O~');
		}).catch((err) => {
			log.error(`\n${err}`);
		});
	});

program
	.command('build')
	.description('from step2 to step5: you need jump to project directory before.')
	.action((repository) => {
		startBuild(repository).then(() => {
			log.info('All Done O(∩_∩)O~');
		}).catch((err) => {
			log.error(`\n${err}`);
		});
	});

program.parse(process.argv);

// 没有参数时, 输出 help
if (!process.argv.slice(2).length) {
	program.outputHelp();
}
