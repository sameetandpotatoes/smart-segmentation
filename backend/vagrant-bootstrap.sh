#!/bin/bash

VAGRANT_PYVE=project

. /vagrant/scripts/provisioning-support.sh

# All "provide" commands must maintain the same order and new ones must be
# added only at the end of the sequence.

provision-note "Additional steps (run as the vagrant user) listed in $(readlink -f ~vagrant)/{{completed-steps}}."

provide "First apt-get update" apt-get update -y
provide "apt-get install of standard packages" apt-get install -y git tmux python-software-properties
provide "Add python3 PPA" add-apt-repository -y ppa:fkrull/deadsnakes
provide "Second apt-get update" apt-get update -y
provide "Install python-pip" apt-get install -y python-pip
provide "Install python3-pip" apt-get install -y python3-pip
provide "Upgrade python3-pip" pip3 install --upgrade pip
provide "Install virtualenv and virtualenvwrapper" pip2 install virtualenv virtualenvwrapper

provide "Log directory for service" mkdir -m a=rwx /var/log/segservice
#
# Dependency system packages

su - vagrant <<END_OF_COMMANDS
    . /vagrant/scripts/provisioning-support.sh

    RC_CMDS='
# Configure python virtualenvwrapper
export WORKON_HOME=\$HOME/.pyve
export PROJECT_HOME=\$HOME/code
. /usr/local/bin/virtualenvwrapper.sh

# Set python virtualenv when changing directory
. /vagrant/scripts/virtualenv-by-pwd.sh
'
    provide ".bashrc setup" --append-to "\$HOME/.bashrc" echo -n "\$RC_CMDS"

    # Execute RC_CMDS (via source) each time, since this runs as "non-interactive"
    source <(echo "\$RC_CMDS")

    PROFILE_CMDS='
# Set python virtualenv if current directory is in a marked tree
workon_cwd
'
    provide ".profile setup" --append-to "\$HOME/.bashrc" echo -n "\$PROFILE_CMDS"

    ENV_NAME=\$(cat /vagrant/.venv 2>/dev/null || echo "$VAGRANT_PYVE")
    echo "Preparing \${ENV_NAME:=$VAGRANT_PYVE} virtualenv..."
    provision-note "Idempotent bootstrap steps for preparing \$ENV_NAME virtualenv."
    if lsvirtualenv -b | grep -q "\$ENV_NAME"; then
        workon "\$ENV_NAME"
    else
        mkvirtualenv -p $(which python3.5) "\$ENV_NAME"
    fi

    pip install --upgrade pip

    if [ -r /vagrant/Packages ]; then
        pip install -r /vagrant/Packages
    fi

    provide "Ensure /vagrant is on the Python path" --scope "\$ENV_NAME" add2virtualenv /vagrant
END_OF_COMMANDS
