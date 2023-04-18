# VIDEO WALL

## Prerequisites

-   A web browser
-   Python3 (optional)

## Description

This is a simple video wall that runs in a browser without the need for a web server.
The layout can be changed.
As browsers do not have access to the file system, the list of video files must be generated in a Javascript file called `playlist.js`.
It is especially useful to watch several videos one after the other with the 1×1 layout.

## playlist.js format

```javascript
playlist = [
"../file_1.mp4",
"../file_2.mp4"
]
```

## Usage

-   Generate the playlist.js file that will contain the path to the videos.
This can be done by hand or with the following python script:

```bash
python3 make_playlist.py
```

-   Double click `videowall.html` to open it in your browser.

## Shortcuts

-   <kbd>k</kbd> Toggle play and pause in all players.
-   <kbd>mouse wheel</kbd> Play next or previous videos in the player currently under the mouse cursor.
-   <kbd>←</kbd> Play previous videos in all players.
-   <kbd>→</kbd> Play next videos in all players.
-   <kbd>↓</kbd> Decrease layout density.
-   <kbd>↑</kbd> Increase layout density.
-   <kbd>0</kbd> 1×1 layout.
-   <kbd>1</kbd> 1×2 layout.
-   <kbd>2</kbd> 2×2 layout.
-   <kbd>3</kbd> 3×3 layout.
-   ...
-   <kbd>s</kbd> Shuffle the order of the playlist.
-   <kbd>o</kbd> Open the video under the mouse cursor in another tab and copy the URL in the clipboard.
-   <kbd>j</kbd> Go back 10 seconds.
-   <kbd>k</kbd> Go forward 10 seconds.
-   <kbd>,</kbd> Go back 1 frame.
-   <kbd>.</kbd> Go forward 1 frame.
-   <kbd>m</kbd> Mute / unmute the video under the mouse cursor.
-   <kbd>r</kbd> Toggle video object fit mode between “cover” mode and “contain” mode for all videos.
-   <kbd>f</kbd> Full screen the video under the mouse cursor.

## Web browser compatibility on macOS

-   Chrome, works best.
-   Safari, but the Developer tools need to be activated and the browser relaunched.
-   Firefox, works but the videos may not play at start, you need to press k, ← or → .

<p align="center">
<img height=400px src="../../raw/master/assets/videowall.jpg" />
</p>
