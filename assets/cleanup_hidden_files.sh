#!/usr/bin/env bash

# Find all hidden directories.
find . -not -path "*.git/*" -not -name ".git*" -type d -name ".*" # -delete

# Find all hidden files.
find . -not -path "*.git/*" -not -name ".git*" -type f -name ".*" # -delete
