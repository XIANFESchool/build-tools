import { Spinner } from 'cli-spinner';
import log from './log';

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

export default waitAnimation
