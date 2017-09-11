#!/bin/bash

"Update the app/package.json version"
"Create a new draft release with tag title: vx.x.x"
"push a commit to the master branch"
"wait for travis and appveyor to complete"

# versionPattern="[0-9]+\.[0-9]+\.[0-9]+(\-beta)*"
#
# tagName=""
# while [[ ! $tagName =~ $versionPattern ]]; do
#   read -p "Tag name (version): " tagName
# done
#
# if GIT_DIR=./.git git rev-parse $tagName >/dev/null 2>&1
# then
#     echo -e "$(tput setaf 1)ERROR: Tag $tagName already exists$(tput sgr0)"
# fi
#
# if ! grep -Fq "\"version\": \"$tagName\"," ./app/package.json; then
#   echo -e "$(tput setaf 1)WOW, wait! The provided tag does not match the app/packagon.json version$(tput sgr0)"
#   exit 1
# fi
#
#
# if git tag $tagName; then
#   echo -e "$(tput setaf 2)Tag created$(tput sgr0)"
# else
#   echo -e "$(tput setaf 1)ERROR: Failed to create tag locally$(tput sgr0)"
#   exit 1
# fi
#
# if git push origin $tagName; then
#   echo -e "$(tput setaf 2)Tag pushed$(tput sgr0)"
# else
#   echo -e "$(tput setaf 1)ERROR: Failed to push tag$(tput sgr0)"
#   exit 1
# fi
#
# echo -e "$(tput setaf 2)Everything went fine :)$(tput sgr0)"
