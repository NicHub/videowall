#!/usr/bin/env bash

###
# To convert SVG to PNG:
# In VSCode, search `jock.svg` in the extension marketplace and install the extension.
# Alternatively, you can go on their repo (https://github.com/lishu/vscode-svg2).
# Open the SVG preview in VS Code.
# Click on `convert` above the preview.
##

# Change FNAMES manualy to choose the movies to generate.
FNAMES=(
    404
    empty
)

for FNAME in "${FNAMES[@]}"; do
    echo "Converting $FNAME.png to $FNAME.mp4"
    ffmpeg -y -hide_banner -loglevel panic -loop 1 -i $FNAME.png -c:v libx264 -t 10 -pix_fmt yuv420p -vf scale=1280:720 $FNAME.mp4
done
