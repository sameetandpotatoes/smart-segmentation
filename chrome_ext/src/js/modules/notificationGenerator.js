function createNotif(title, messageContent) {
  chrome.notifications.create(title.split(' ').join(' '), {
    type: 'basic',
    iconUrl: '../images/icon.png',
    // iconUrl: 'https://cdn.business2community.com/wp-content/uploads/2018/01/segmentation_1515384711.png',
    title: title,
    message: messageContent
  });
}

export { createNotif };
