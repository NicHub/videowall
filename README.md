# VIDEO WALL

## Prerequisites

- A web browser
- NodeJS (optional)

## Description

It is a simple video wall that runs in a browser without the need for a web server. The layout can be changed. As browsers do not have access to the file system, the list of video files must be generated in a Javascript file called `playlist.js`.

It is especially useful to watch several videos one after the other with the 1×1 layout.

## playlist.js format

```javascript
playlist = [
"../file_1.mp4",
"../file_2.mp4"
]
```

## Usage

- Generate the playlist.js file that will contain the path to the videos. This can be done by hand or with the following NodeJS script:

```bash
node make_playlist.js
```

- Double click `videowall.html` to open it in your browser.

## Shortcuts

- Press k to toggle play and pause in all players.
- Use the mouse wheel to play next or previous videos in the player currently under the mouse cursor.
- Press ← or → to play next or previous videos in all players.
- Press ↓ or ↑ to change the layout.
- Press a number from 0 to 4 to select a given layout.
    - Press 0 for 1×1 layout.
    - Press 1 for 1×2 layout.
    - Press 2 for 2×2 layout.
    - Press 3 for 3×3 layout.
    - ...
- Press s to shuffle the playlist order.

## Web browser compatibility on macOS

- Chrome, works best.
- Safari, but the Developer tools need to be activated and the browser relaunched.
- Firefox, works but the videos may not play at start, you need to press k, ← or → .


<p align="center">
<img height=400px src="https://github.com/NicHub/videowall/raw/master/videowall.jpg" />
</p>
