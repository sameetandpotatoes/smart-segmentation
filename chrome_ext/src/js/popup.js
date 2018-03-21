import handlers from './modules/handlers';
import msg from './modules/msg';
import form from './modules/form';
import runner from './modules/runner';

// This is invoked when the "Smart-Segmentation button is pressed.

// We will use this to display results when a segmentation has been processed

// It should get results from the background via a msg handler

// Invoked when the smart segmentation button on the Chrome toolbar is clicked.
console.log('POPUP SCRIPT WORKS!');

form.init(runner.go.bind(runner, msg.init('popup', handlers.create('popup'))));
