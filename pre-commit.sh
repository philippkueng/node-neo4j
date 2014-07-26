#!/bin/bash

function cleanup {
    if [[ $? > 0 ]] ; then
        echo "You might want to run 'git stash pop' in order to get your files back"
    fi
}

trap "cleanup" EXIT

FILENAME=$0
if [ -h $FILENAME ] ; then
    FILENAME=`readlink -e $FILENAME`
fi
DIR=`dirname $FILENAME`

# make sure only changes of the current commit are affected
git stash -q -u --keep-index

./node_modules/grunt-cli/bin/grunt lint

exit_code=$?

git stash pop -q

exit $exit_code
