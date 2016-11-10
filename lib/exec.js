import { exec } from 'child_process';

export default function(cmdLine, spinner, successCallback, errorCallback) {
	return new Promise((resolve, reject) => {
		spinner && spinner.start();
		exec(cmdLine, (error, stdout, stderr) => {
			if (error) {
				spinner && spinner.stop();
				errorCallback && errorCallback(reject, stderr)
			} else {
				spinner && spinner.stop(true);
				successCallback && successCallback(resolve, stdout);
			}
		});
	});
}
