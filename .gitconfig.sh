#!/usr/bin/env bash

# Set colors
GREEN='\033[1;32m'
NC='\033[0m'

# Connect repo's .gitconfig
git config --local include.path '../.gitconfig'
printf "${GREEN}Git config was successfully set.${NC}\n"

