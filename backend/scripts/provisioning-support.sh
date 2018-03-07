#!/bin/false

VPS_STEP=1
VPS_STEPS_COMPLETED="$HOME/.vps-steps-completed"

function provide() {
    local step_name="Step $VPS_STEP"
    local step_desc=$1
    local result=0
    local output_to=/dev/stdout
    shift
    
    if [[ $1 =~ ^- ]]; then
        case $1 in
            --append-to)
                output_to=$2
                shift 2
                ;;
            
            --scope)
                step_name="$step_name - $2"
                shift 2
                ;;
            
            *)
                echo "Error in flags passed to provide(): Unknown flag $1"
                exit 1
                ;;
        esac
    fi
    
    if [ -f "$VPS_STEPS_COMPLETED" ] && grep -q "^$step_name\\b" "$VPS_STEPS_COMPLETED"; then
        echo "$step_desc already complete."
    else
        echo "Providing $step_desc:"
        ("$@") >>"$output_to" && (echo "$step_name: $step_desc" >>"$VPS_STEPS_COMPLETED")
        result=$?
    fi
    
    VPS_STEP=$(( $VPS_STEP + 1 ))
    return $result
}

function provision-note() (
    NOTE_BODY=$(echo -n "$*" | sed "s/{{completed-steps}}/$(basename "$VPS_STEPS_COMPLETED")/")
    
    if grep -Fq "$NOTE_BODY" "$VPS_STEPS_COMPLETED"; then
        return 0
    fi
    
    echo "
NOTE: $NOTE_BODY
" >>"$VPS_STEPS_COMPLETED"
)
