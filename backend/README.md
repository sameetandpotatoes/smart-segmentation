# Segmentation Backend Service (segservice)

This codebase provides functionality to our Chrome extension in two layers:
* The currently supported transport for communicating with this service is HTTP(S) using the POST method, with entry point bindings corresponding to the path component of the URL
* Functionality is provided via exchange of JSON documents (request and response) on bound application entry point names (established with `segservice.app.method`)

## Getting Started

1. Install VirtualBox (https://www.virtualbox.org/wiki/Downloads).
1. Install Vagrant (https://vagrantup.com).
1. Run `vagrant up` in this directory to set up your vagrant machine.
1. `vagrant ssh` into your new VM and:
  1. `cd /vagrant` to get to the working/shared directory.
  1. Run `./devserver.py` to start the development server.

## Extras for Development

There are some useful extra tools not necessary for running the server but helpful for developers.  To install those:

1. `vagrant ssh` into your VM.
1. `cd /vagrant` into the working/shared directory.
1. `pip install -r DevPackages` to install these extra, developer-friendly packages.

## Adding Functionality

The key thing to look at is `segservice.app.method` -- this is usually called in a function decorator to bind that function to an entry point name (for HTTP transport, this is the path part of the URL).  This binding is usually done in the `segservice.exposed_methods` module, which does `from segservice import app`, so the decorator actually looks like `@app.method(...)`.  The bound function should accept (and require only) one positional parameter; if this parameter has an annotation, that annotation should be a class as described in the docstring for `segservice.app.method`.

## Deployment

This project is designed to deploy via Capistrano.  You will need the Ruby gems defined in `Gemfile.deploy` installed -- you can install them globally or use RVM (https://rvm.io) to install in the "ruby-2.2.5@segservice" gemset (defined in `.ruby-version`).  If using RVM, you will need ruby-2.2.5 to use this gemset.

#### Setup

_If RVM is installed and has ruby-2.2.5 installed:_ Changing into this directory will select the isolated gemset.

In order to install from a `Gemfile`, you need the `bundler` gem, so run:
```bash
gem install bundler
```

Then, install the deployment gems with:
```bash
bundle install --gemfile=Gemfile.deploy
```

#### Pushing the Updated Project

Deploy this project to the public server with:
```bash
cap public deploy
```

This always deploys the `master` branch of the project from GitLab.
