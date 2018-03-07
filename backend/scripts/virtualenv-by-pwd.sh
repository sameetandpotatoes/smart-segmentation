
# Based on the work of Harry Marr

function cwd_venv {
    local cur_dir=$PWD
    while [ "$cur_dir" != "/" ]; do
        if [ -a "$cur_dir/.venv" ]; then
            cat "$cur_dir/.venv"
            return 0
        fi
        cur_dir=$(dirname "$cur_dir")
    done
}

function workon_cwd {
    CWD_ENV=$(cwd_venv)
    if [ -n "$CWD_ENV" ]; then
        if [ "$VIRTUAL_ENV" != "$WORKON_HOME/$CWD_ENV" ]; then
            if [ -e "$WORKON_HOME/$CWD_ENV/bin/activate" ]; then
                workon "$CWD_ENV" && export CD_VIRTUAL_ENV="$CWD_ENV"
            fi
        fi
    elif [ $CD_VIRTUAL_ENV ]; then
        deactivate && unset CD_VIRTUAL_ENV
    fi
}

function venv_cd {
    cd "$@" && workon_cwd
}

alias cd="venv_cd"
