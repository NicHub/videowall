#!/bin/bash

# Convert 404.svg to 404.png
# Install https://github.com/lishu/vscode-svg2
# Open the preview in VS Code
# Click on convert above the preview

ffmpeg -y -loop 1 -i 404.png -c:v libx264 -t 10 -pix_fmt yuv420p -vf scale=1280:720 404.mp4
