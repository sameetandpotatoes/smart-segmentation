# smart-segmentation

Smart segmentation is about finding the boundaries between phrases within a text that are most important to users.

This is a chrome extension that enables smart segmentation of text and communicates with gensim in the backend to get segmentations and ranks them via a ranking function.

## Steps to reproduce

Follow the setup instructions and run the evaluation script

## Setup

The backend uses vagrant.

```
cd backend
vagrant up
vagrant ssh
vagrant@vagrant:~$ cd /vagrant
vagrant@vagrant:~$ ./devserver
```

To run the evaluation model, in vagrant, run:

```
>vagrant@vagrant:~$ python3 evalmodel.py
```

The UI uses node, and requires `npm`.

```
cd chrome_ext
npm install
npm start
```

`npm start` auto-watches for JS changes, and puts it in a build/dev folder. Open Chrome, and load the dev folder as a Chrome Extension.
