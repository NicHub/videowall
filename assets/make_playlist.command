#!/usr/bin/env bash

# Usage:
# chmod a+x make_playlist.command # Not needed on exFAT.
# double click on file
#
# If Gatekeeper gets in the way, remove apple extended attributes manually
# xattr -c make_playlist.command

# https://stackoverflow.com/a/29710607

cd -- "$(dirname "$0")"

# /usr/bin/env node ./make_playlist.js
/usr/bin/env python3 ./make_playlist.py

echo -e "\n###\n"
Ls -la playlist.js
echo -e "\n###\n"