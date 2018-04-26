import $ from 'jquery';


// Invoked when the smart segmentation button on the Chrome toolbar is clicked.
$(document).ready(function() {
    $('input[type="radio"]').click(function() {
        if ($(this).is(':checked')) {
            chrome.runtime.sendMessage({ segmentation_type: $(this).val() }, function(response) {
                console.log(response);
            });
        }
    });
});
