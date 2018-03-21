import handlers from './modules/handlers';
import msg from './modules/msg';
import form from './modules/form';
import runner from './modules/runner';

console.log('OPTIONS SCRIPT WORKS!'); // eslint-disable-line no-console

form.init(runner.go.bind(runner, msg.init('options', handlers.create('options'))));
