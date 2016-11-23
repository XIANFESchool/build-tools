var inquirer = require('inquirer');

export default function(skipMessage = 'is skip this step ?' ) {
	return new Promise((resolve, reject) => {
		inquirer.prompt([
				{
					type: 'confirm',
					name: 'isSkip',
					message: skipMessage,
					default: false
				}])
			.then((answers) => {
				resolve(answers.isSkip);
			}).catch((err) => {
			reject(err);
		});
	});
}
