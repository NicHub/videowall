#!/usr/bin/env bash

# Find all hidden directories.
find . -type d -name ".*" -not -name ".git*" -not -name ".Trashes*" -not -name ".Spotlight-V100*"

# Find all hidden files.
find . -type f -name ".*" -not -path "*.git/*" -not -path "*.Trashes/*" -not -path "*.Spotlight-V100/*" -not -name ".git*"
