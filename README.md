# VIDEO WALL

## Prerequisites

- A web browser (tested on Safari and Chrome on macOS).
- NodeJS (optional)

## Description

It is a simple video wall that runs in a browser without the need for a web server. It has a fixed layout of 3 ✕ 3 videos. As browsers do not have access to the file system, the list of video files must be generated in a Javascript file called `playlist.js`.

## playlist.js format

```javascript
playlist = [
"../file_1.mp4",
"../file_2.mp4"
]
```

## Usage

- Generate the Javascript file that will contain the path to the videos. This can be done by hand or with the following NodeJS script:

```bash
node make_playlist.js
```

- Double click `videowall.html` to open it in your browser.

- Use the mouse wheel to switch between videos.
