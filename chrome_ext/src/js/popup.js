import $ from 'jquery';

$(document).ready(function() {
    chrome.storage.sync.get("segType", function(segType) {
      if (!chrome.runtime.error) {
        $('#type_' + segType['segType']).prop('checked', true);
      }
    });

    $('input[type="radio"]').click(function() {
        if ($(this).is(':checked')) {
            chrome.runtime.sendMessage({ segmentation_type: $(this).val() }, function(response) {
                console.log(response);
            });
        }
    });
});
