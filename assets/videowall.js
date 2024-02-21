"use strict";

const INITIAL_DOC_TITLE =
    typeof STARTUP_DEFAULTS["TITLE"] === "undefined"
        ? document.title
        : STARTUP_DEFAULTS["TITLE"];
const BEGIN_AT = STARTUP_DEFAULTS["BEGIN_AT"];
const NB_VIDEOS_MAX = STARTUP_DEFAULTS["NB_VIDEOS_MAX"];
const WHEEL_EVENT_DELAY = 200;
let V_ATTR = {
    controls: undefined,
    autoplay: undefined,
    muted: undefined,
};
let IS_PLAYING = undefined;
let ALLOWED_NB_VIDEOS = [];
let ALL_VIDEOS = [];
let VIDEO_TEMPLATE = document.getElementById("v0");
let MOVIE_ORDERS = [];
let NB_VIDEOS = STARTUP_DEFAULTS["NB_VIDEOS"];
let PREVIOUS_WHEEL_TIME = 0;
const PLAYBACK_SPEED_OVERLAY = document.getElementById(
    "playback_speed_overlay"
);
const POSSIBLE_PLAYBACK_RATES = [0, 0.1, 0.5, 1, 1.5, 2, 5, 10, 16];
let CURRENT_PLAYBACK_RATE_ID = 3;

/**
 * Start
 */
init();

/**
 *
 */
function init() {
    const container = document.getElementById("container");

    // Abort if the playlist is not defined.
    if (typeof PLAYLIST === "undefined") {
        container.innerHTML = `
<p>The playlist file cannot be found!</p>
<p>The default playlist must be in <code>./assets/playlist.js</code>.</p>
<p>It is also possible to specify the URL to another playlist in the GET parameter,<br/>for example:
<code>videowall.html?playlist=./assets/other_playlist.js</code></p>
<p>Here is a minimal playlist example:</p>
<pre>playlist <span class="pl-k">=</span> [
    <span class="pl-s"><span class="pl-pds">"</span>../file_1.mp4<span class="pl-pds">"</span></span>,
    <span class="pl-s"><span class="pl-pds">"</span>../file_2.mp4<span class="pl-pds">"</span></span>
    ]</pre>`;
        return;
    }

    // Abort if the playlist is empty.
    if (PLAYLIST.length === 0) {
        container.innerHTML = "<p>Playlist is empty. Aborting.</p>";
        return;
    }

    // Create the <style> element that will by modified when the layout changes.
    const style = document.createElement("style");
    style.id = "css_generated_in_javascript";
    const head = document.getElementsByTagName("head")[0];
    head.appendChild(style);

    // Add the class ".modified_in_javascript" to the video template.
    VIDEO_TEMPLATE.classList.add("modified_in_javascript");

    // Set document title.
    document.title = `${INITIAL_DOC_TITLE} | ${PLAYLIST.length} VIDEOS`;

    // Read attributes of video template.
    V_ATTR["controls"] = VIDEO_TEMPLATE.controls;
    V_ATTR["autoplay"] = VIDEO_TEMPLATE.autoplay;
    V_ATTR["muted"] = VIDEO_TEMPLATE.muted;

    // Set IS_PLAYING.
    IS_PLAYING = !V_ATTR["autoplay"];

    // Fill the array `ALLOWED_NB_VIDEOS`.
    if (NB_VIDEOS_MAX < 2) {
        ALLOWED_NB_VIDEOS = [1];
    } else {
        ALLOWED_NB_VIDEOS = [1, 2];
        const _max = Math.floor(Math.sqrt(NB_VIDEOS_MAX));
        for (let index = 2; index <= _max; index++) {
            ALLOWED_NB_VIDEOS.push(index * index);
        }
    }

    // Key listener attached to the <body> element.
    document
        .getElementsByTagName("body")[0]
        .addEventListener("keyup", keyboardShortcutHandler);

    // Help browsers to hide the mouse cursor.
    forceCursorHide();

    // Let’s begin the serious stuff.
    main();
}

/**
 *
 */
function forceCursorHide() {
    let cursorTimeout;

    function hideCursor() {
        document.body.style.cursor = "none";
    }

    function resetCursorTimeout() {
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(hideCursor, 500);
    }

    document.addEventListener("mousemove", () => {
        document.body.style.cursor = "default";
        resetCursorTimeout();
    });

    document.addEventListener("keydown", () => {
        document.body.style.cursor = "default";
        resetCursorTimeout();
    });

    resetCursorTimeout();

    document.addEventListener("click", resetCursorTimeout);
    document.addEventListener("scroll", resetCursorTimeout);
}

/**
 *
 */
function main() {
    // Create the CSS style according to the current layout.
    const _w = NB_VIDEOS === 2 ? 50 : 100 / Math.sqrt(NB_VIDEOS);
    const _h = NB_VIDEOS === 2 ? 100 : _w;
    document.getElementById(
        "css_generated_in_javascript"
    ).innerHTML = `.modified_in_javascript {width: ${_w}%; height: ${_h}vh;}`;

    // Remove current videos.
    const cur_videos = document.getElementsByTagName("video");
    for (let cnt = cur_videos.length - 1; cnt >= 0; cnt--) {
        if (cur_videos[cnt].id !== "v0") {
            cur_videos[cnt].parentNode.removeChild(cur_videos[cnt]);
        }
    }

    // Duplicate video element.
    ALL_VIDEOS = [VIDEO_TEMPLATE];
    let last_video = VIDEO_TEMPLATE;
    for (let index = 1; index < NB_VIDEOS; index++) {
        let _video = VIDEO_TEMPLATE.cloneNode(true);
        _video.id = "v" + index;
        _video.addEventListener("keydown", function (event) {
            preventDefault(event);
        });
        if (V_ATTR["muted"]) _video.muted = true; // Needed because FF doesn’t duplicate the mute attribute.
        VIDEO_TEMPLATE.parentNode.insertBefore(_video, last_video.nextSibling);
        last_video = _video;
        ALL_VIDEOS.push(_video);
    }

    // Prepare each video.
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];

        // Set movie metadata.
        // `moviepathidskey` is the current index in the `moviepathids` array.
        _video.setAttribute("data-moviepathidskey", 0);

        // `moviepathids` is an array that contains the indexes of
        // the videos that the current player can play.
        const moviepathids = [];
        for (let key = index; key < PLAYLIST.length; key += NB_VIDEOS) {
            moviepathids.push(key);
        }
        _video.setAttribute("data-moviepathids", moviepathids);

        // `moviepathid` is the index of the current video.
        _video.setAttribute("data-moviepathid", index);

        // Add wheel event.
        _video.addEventListener(
            "wheel",
            function () {
                const current_wheel_time = new Date().getTime();
                if (
                    current_wheel_time - PREVIOUS_WHEEL_TIME <
                    WHEEL_EVENT_DELAY
                )
                    return;
                PREVIOUS_WHEEL_TIME = current_wheel_time;
                nextVideoSingle(this, event.deltaY < 0 ? -1 : +1);
            },
            { passive: true }
        );

        // Add ended event.
        _video.addEventListener(
            "ended",
            function () {
                nextVideoSingle(this, 1);
            },
            false
        );

        // Drag and drop for reordering by user.
        // TODO: Drag and drop don’t work as expected yet,
        // so _video.draggable is set to false.
        _video.draggable = false;
        _video.ondragend = function () {
            onDragEnd(_video.id);
        };

        // Set video source and play.
        setVideoSrcAndPlay(_video, PLAYLIST[index]);

        // Ensure that the playback speed is
        // maintained when the layout is changed.
        videoSetPlaybackRateAll(0);
    }
}

/**
 * Prevent default browser behaviours for some event keys.
 */
const KEYS_PREVENTDEFAULT = ["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"];
function preventDefault(event) {
    if (!KEYS_PREVENTDEFAULT.includes(event.key)) return;
    event.preventDefault();
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(array) {
    // While there are elements in the array:
    // - Pick a random index
    // - Decrease counter by 1
    // - And swap the last element with it
    let counter = array.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

/**
 * Play next or previous video. Applies to all displayed videos.
 */
function nextVideoAll(increment) {
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];
        nextVideoSingle(_video, increment);
    }
}

/**
 * Play next or previous video. Applies to chosen video only.
 */
function nextVideoSingle(_video, increment) {
    if (!(_video instanceof HTMLVideoElement)) return;
    // Get and Set movie metadata.
    let moviepathidskey = parseInt(_video.getAttribute("data-moviepathidskey"));
    const moviepathids = _video.getAttribute("data-moviepathids").split(",");
    moviepathidskey = (moviepathidskey + increment) % moviepathids.length;
    moviepathidskey =
        moviepathidskey < 0
            ? moviepathids.length + moviepathidskey
            : moviepathidskey;
    _video.setAttribute("data-moviepathidskey", moviepathidskey);
    _video.setAttribute("data-moviepathids", moviepathids);
    const newmoviepathid = parseInt(moviepathids[moviepathidskey]);
    _video.setAttribute("data-moviepathid", newmoviepathid);

    // Set video source and play.
    setVideoSrcAndPlay(_video, PLAYLIST[newmoviepathid]);
}

/**
 *
 */
function setVideoSrcAndPlay(_video, _src) {
    if (!(_video instanceof HTMLVideoElement)) return;
    _video.addEventListener("error", function () {
        console.error(`Error: ${_src}`);
        _video.src = "./assets/404.mp4";
    });

    _video.addEventListener(
        "loadedmetadata",
        function () {
            videoChangeObjectFitMode(_video, "auto");
        },
        false
    );

    _video.addEventListener(
        "loadeddata",
        function () {
            videoGoToRelativeTime(_video, BEGIN_AT);
            if (
                _video.src.includes("404.mp4") ||
                _video.src.includes("empty.mp4")
            ) {
                _video.controls = false;
                return;
            }
            _video.controls = V_ATTR["controls"];
            const play_promise = IS_PLAYING ? _video.pause() : _video.play();
            if (play_promise !== undefined) {
                play_promise.catch((_) => {});
            }
        },
        false
    );

    if (_src === void 0) {
        _src = "./assets/empty.mp4";
    }
    _video.src = _src;
    _video.load();

    console.info(`Playing: ${_video.src}`);

    // `title` is the tooltip text displayed on hover.
    // _video.setAttribute("title", `VIDEO\n${_video.src}`);
}

/**
 *
 */
function changeLayout(layout_id) {
    console.log(`layout_id = ${layout_id}`);
    if (NB_VIDEOS_MAX < 2) return;
    const _max = Math.floor(Math.sqrt(NB_VIDEOS_MAX));
    const _min = 0;
    const cur_id = ALLOWED_NB_VIDEOS.indexOf(NB_VIDEOS);
    const nb_id = ALLOWED_NB_VIDEOS.length;
    let next_id;
    if (layout_id == "increase") {
        if (cur_id == _max) {
            return;
        }
        next_id = (cur_id + 1) % nb_id;
    } else if (layout_id == "decrease") {
        if (cur_id == _min) {
            return;
        }
        next_id = (cur_id + nb_id - 1) % nb_id;
    } else if (layout_id >= 0 && layout_id < ALLOWED_NB_VIDEOS.length) {
        next_id = layout_id;
    } else {
        return;
    }

    NB_VIDEOS = ALLOWED_NB_VIDEOS[next_id];
    main();
}

/**
 *
 */
function videoPlayPauseToggleAll() {
    IS_PLAYING = !IS_PLAYING;
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];
        const play_promise = IS_PLAYING ? _video.pause() : _video.play();
        if (play_promise !== undefined) {
            play_promise.catch((_) => {});
        }
    }
}

/**
 *
 */
function videoPause(_video) {
    if (!(_video instanceof HTMLVideoElement)) return;
    const play_promise = _video.pause();
    if (play_promise !== undefined) {
        play_promise.catch((_) => {});
    }
}

/**
 *
 */
function getVideoUnderCursor() {
    let _video = document.querySelector("video:hover");
    if (!(_video instanceof HTMLVideoElement)) {
        _video === void 0;
    }
    return _video;
}

/**
 * 0.0 ≤ relativeTime ≤ 1.0
 */
function videoGoToRelativeTime(_video, relativeTime) {
    if (!(_video instanceof HTMLVideoElement)) return;
    if (isNaN(relativeTime)) return;
    relativeTime = parseFloat(relativeTime);
    if (relativeTime < 0) return;
    if (relativeTime > 1) return;
    if (relativeTime === 1) {
        _video.pause();
    }
    const absoluteTime = _video.duration * relativeTime;
    _video.currentTime = absoluteTime;
}

/**
 * if absTime < 0 => time is measured from the end.
 */
function videoGoToAbsoluteTime(_video, absoluteTime) {
    if (!(_video instanceof HTMLVideoElement)) return;
    if (isNaN(absoluteTime)) return;
    absoluteTime = parseFloat(absoluteTime);
    if (Math.abs(absoluteTime) > _video.duration) return;
    if (absoluteTime < 0) absoluteTime += _video.duration;
    if (absoluteTime === _video.duration) {
        _video.pause();
    }
    _video.currentTime = absoluteTime;
}

/**
 *
 */
function videoOpenInSingleTabAndCopyPathToClipboard(_video) {
    if (!(_video instanceof HTMLVideoElement)) return;
    let path = _video.src.replace("file://", "");
    console.log(_video.src);
    console.log(path);
    try {
        path = decodeURI(path);
    } catch (e) {
        console.error(e);
    }
    path = path.replace(/%23/g, "#");
    if (window.navigator.platform in ["Win32"]) {
        path = path.replace(/\//g, "\\");
    }
    copyInClipboard(`"${path}"`, function () {
        window.open(_video.src);
    });
}

/**
 *
 */
function videoGoForwardOrBackward(_video, dT) {
    if (!(_video instanceof HTMLVideoElement)) return;
    _video.currentTime = parseFloat(_video.currentTime + dT);
}

/**
 *
 */
function videoSetPlaybackRate(_video, increment) {
    if (!(_video instanceof HTMLVideoElement)) return;
    if (parseInt(increment) !== increment) return;
    const new_rate_id = CURRENT_PLAYBACK_RATE_ID + increment;
    if (new_rate_id > POSSIBLE_PLAYBACK_RATES.length - 1) return;
    if (new_rate_id < 0) return;

    CURRENT_PLAYBACK_RATE_ID = new_rate_id;
    try {
        _video.playbackRate = POSSIBLE_PLAYBACK_RATES[CURRENT_PLAYBACK_RATE_ID];
    } catch (err) {
        console.info(
            `Playback rate of ${POSSIBLE_PLAYBACK_RATES[CURRENT_PLAYBACK_RATE_ID]} is not in the supported playback range.\n${err}`
        );
        return;
    }
    PLAYBACK_SPEED_OVERLAY.style.top = `${
        _video.getBoundingClientRect()["top"] + 10
    }px`;
    PLAYBACK_SPEED_OVERLAY.style.left = `${
        _video.getBoundingClientRect()["left"] + 10
    }px`;
    const nb_digits = _video.playbackRate < 2 ? 1 : 0;
    PLAYBACK_SPEED_OVERLAY.innerHTML = `<p>${_video.playbackRate.toFixed(
        nb_digits
    )}<span style="font-family:sans-serif;">&thinsp;</span>×</p>`;
    PLAYBACK_SPEED_OVERLAY.classList.add("display-flex");
    PLAYBACK_SPEED_OVERLAY.classList.remove("display-none");
    if (_video.playbackRate === 1) {
        setTimeout(function () {
            PLAYBACK_SPEED_OVERLAY.classList.remove("display-flex");
            PLAYBACK_SPEED_OVERLAY.classList.add("display-none");
        }, 500);
    }
}

/**
 *
 */
function videoSetPlaybackRateAll(increment) {
    for (let index = NB_VIDEOS - 1; index >= 0; index--) {
        const _video = ALL_VIDEOS[index];
        videoSetPlaybackRate(_video, increment);
        increment = 0;
    }
}

/**
 *
 */
function videoMuteToggle(_video) {
    if (!(_video instanceof HTMLVideoElement)) return;
    for (let index = 0; index < NB_VIDEOS; index++) {
        const cur_video = ALL_VIDEOS[index];
        if (cur_video.id === _video.id) {
            _video.muted = !_video.muted;
        } else {
            cur_video.muted = true;
        }
    }
}

/**
 *
 */
function videoFullScreenToggle(_video) {
    if (!(_video instanceof HTMLVideoElement)) return;
    for (let index = 0; index < NB_VIDEOS; index++) {
        const cur_video = ALL_VIDEOS[index];
        if (cur_video.id !== _video.id) {
            videoPause(cur_video);
        }
    }
    if (_video.requestFullscreen) {
        _video.requestFullscreen();
    } else if (_video.mozRequestFullScreen) {
        _video.mozRequestFullScreen();
    } else if (_video.webkitRequestFullscreen) {
        _video.webkitRequestFullscreen();
    } else if (_video.msRequestFullscreen) {
        _video.msRequestFullscreen();
    }
}

/**
 *
 */
let domWithVideo = void 0;
let domWithThumbs = void 0;
let currentView = "videos";
function videoToggleThumbView() {
    const container = document.getElementById("container");
    if (domWithVideo === void 0) {
        domWithVideo = container.innerHTML;
    }
    if (domWithThumbs === void 0) {
        domWithThumbs = "";
        for (let index = 0; index < PLAYLIST.length; index++) {
            const videoSrc = PLAYLIST[index];
            const lastIndex = videoSrc.lastIndexOf("/");
            const thumbSrc =
                videoSrc.substring(0, lastIndex) +
                "/thumbs/" +
                videoSrc.substring(lastIndex + 1) +
                ".jpg";
            domWithThumbs += `<a target="_blank" href="${videoSrc}"><img src="${thumbSrc}"></a>\n`;
            console.log(domWithThumbs);
        }
    }
    if (currentView === "videos") {
        container.innerHTML = domWithThumbs;
        currentView = "thumbs";
    } else if (currentView === "thumbs") {
        currentView = "videos";
        container.innerHTML = domWithVideo;
    }
}

/**
 *
 */
function videoChangeObjectFitMode(_video, mode) {
    if (!(_video instanceof HTMLVideoElement)) return;
    if (mode === "cover") {
        _video.classList.remove("object-fit-contain");
        _video.classList.add("object-fit-cover");
    } else if (mode === "contain") {
        _video.classList.remove("object-fit-cover");
        _video.classList.add("object-fit-contain");
    } else if (mode === "toggle") {
        if (_video.classList.contains("object-fit-cover"))
            videoChangeObjectFitMode(_video, "contain");
        else if (_video.classList.contains("object-fit-contain"))
            videoChangeObjectFitMode(_video, "cover");
        else videoChangeObjectFitMode(_video, "cover");
    } else if (mode === "auto") {
        if (_video.videoWidth < _video.videoHeight)
            videoChangeObjectFitMode(_video, "contain");
        else videoChangeObjectFitMode(_video, "cover");
    }
}

/**
 *
 */
function videoToggleObjectFitModeAll(mode) {
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];
        videoChangeObjectFitMode(_video, mode);
    }
}

/**
 *
 */
function onDragEnd(source_id) {
    const source_vid = document.getElementById(source_id);
    const target_vid = getVideoUnderCursor();
    const source_moviepathid = source_vid.getAttribute("data-moviepathid");
    const target_moviepathid = target_vid.getAttribute("data-moviepathid");
    const source_moviepath = PLAYLIST[source_moviepathid];
    const target_moviepath = PLAYLIST[target_moviepathid];
    PLAYLIST[source_moviepathid] = target_moviepath;
    PLAYLIST[target_moviepathid] = source_moviepath;
    main();
}

/**
 *
 */
function copyInClipboard(_text, callback) {
    navigator.clipboard
        .writeText(_text)
        .then(function () {
            if (callback) {
                callback();
            }
        })
        .catch(function (err) {
            console.error("Clipboard write failed!", err);
        });
}

/**
 * Keyboard shortcuts inspired from YouTube
 * https://support.google.com/youtube/answer/7631406
 */
function keyboardShortcutHandler(event) {
    // console.log("");
    // console.log(event);
    // console.log(event.key);
    // console.log(!isNaN(parseInt(event.key)));
    // console.log(parseInt(event.key));
    // console.log(parseFloat(event.key));
    // console.log(parseFloat(event.keyCode));

    preventDefault(event);
    const repeat = event.repeat;
    if (repeat) {
        return;
    }
    if (["ArrowUp"].includes(event.key)) {
        // -   <kbd>↑</kbd> Increase layout density.
        changeLayout("increase");
    } else if (["ArrowDown"].includes(event.key)) {
        // -   <kbd>↓</kbd> Decrease layout density.
        changeLayout("decrease");
    } else if (event.keyCode >= 48 && event.keyCode <= 57) {
        // -   <kbd>Shift+0..9</kbd> Change player layout.
        if (event.shiftKey) changeLayout(event.keyCode - 48);
        // -   <kbd>0..9</kbd> Go to relative time for track under the mouse cursor.
        else videoGoToRelativeTime(getVideoUnderCursor(), event.key / 10);
    } else if (["§"].includes(event.key)) {
        // -   <kbd>§</kbd> Go to the end for track under cursor.
        videoGoToRelativeTime(getVideoUnderCursor(), 1);
    } else if (["ArrowRight"].includes(event.key)) {
        // -   <kbd>Shift+Alt+→</kbd> Moves 100 tracks forward in the playlist.
        if (event.shiftKey && event.altKey)
            nextVideoAll(Math.round(100 / NB_VIDEOS));
        // -   <kbd>Alt+→</kbd> Moves 10 tracks forward in the playlist.
        else if (event.altKey) nextVideoAll(Math.round(10 / NB_VIDEOS));
        // -   <kbd>Shift+→</kbd> Moves 1 track forward in the playlist.
        else if (event.shiftKey) nextVideoAll(1);
        // -   <kbd>→</kbd> Seek forward 5 seconds for track under the mouse cursor.
        else videoGoForwardOrBackward(getVideoUnderCursor(), +5);
    } else if (["ArrowLeft"].includes(event.key)) {
        // -   <kbd>Shift+Alt+→</kbd> Moves 100 tracks backward in the playlist.
        if (event.shiftKey && event.altKey)
            nextVideoAll(Math.round(-100 / NB_VIDEOS));
        // -   <kbd>Alt+→</kbd> Moves 10 tracks backward in the playlist.
        else if (event.altKey) nextVideoAll(Math.round(-10 / NB_VIDEOS));
        // -   <kbd>Shift+→</kbd> Moves 1 track backward in the playlist.
        else if (event.shiftKey) nextVideoAll(-1);
        // -   <kbd>→</kbd> Seek backward 5 seconds for track under the mouse cursor.
        else videoGoForwardOrBackward(getVideoUnderCursor(), -5);
    } else if (["y", "Y"].includes(event.key)) {
        // -   <kbd>y</kbd> Moves 1 track backward in the playlist.
        nextVideoAll(-1);
    } else if (["x", "X"].includes(event.key)) {
        // -   <kbd>x</kbd> Moves 1 track forward in the playlist.
        nextVideoAll(1);
    } else if (["s", "S"].includes(event.key)) {
        // -   <kbd>s</kbd> Shuffle the order of the playlist.
        PLAYLIST = shuffle(PLAYLIST);
        main();
    } else if (["i", "I"].includes(event.key)) {
        // -   <kbd>i</kbd> Open the track under the mouse cursor in another tab and copy the URL in the clipboard.
        videoOpenInSingleTabAndCopyPathToClipboard(getVideoUnderCursor());
    } else if (["Home"].includes(event.key)) {
        // -   <kbd>Home</kbd> Seek to the beginning of the video.
        videoGoToRelativeTime(getVideoUnderCursor(), 0);
    } else if (["End"].includes(event.key)) {
        // -   <kbd>End</kbd> Seek to the last seconds of the video.
        videoGoToAbsoluteTime(getVideoUnderCursor(), -2);
    } else if (["j", "J"].includes(event.key)) {
        // -   <kbd>j</kbd> Seek backward 10 seconds in track under the mouse cursor.
        videoGoForwardOrBackward(getVideoUnderCursor(), -10);
    } else if ([" ", "k", "K"].includes(event.key)) {
        // -   <kbd>k</kbd> Toggle play and pause in all players.
        videoPlayPauseToggleAll();
    } else if (["l", "L"].includes(event.key)) {
        // -   <kbd>l</kbd> Seek forward 10 seconds in track under the mouse cursor.
        videoGoForwardOrBackward(getVideoUnderCursor(), +10);
    } else if ([","].includes(event.key)) {
        // -   <kbd>,</kbd> Skip to the next frame.
        videoGoForwardOrBackward(getVideoUnderCursor(), -1 / 25);
    } else if (["."].includes(event.key)) {
        // -   <kbd>.</kbd> Skip to the previous frame.
        videoGoForwardOrBackward(getVideoUnderCursor(), 1 / 25);
    } else if (["m", "M"].includes(event.key)) {
        // -   <kbd>m</kbd> Mute / unmute the track under the mouse cursor.
        videoMuteToggle(getVideoUnderCursor());
    } else if (["r", "R"].includes(event.key)) {
        // -   <kbd>r</kbd> Toggle video object fit mode between “cover” mode and “contain” mode for all videos.
        videoToggleObjectFitModeAll("toggle");
    } else if (["f", "F"].includes(event.key)) {
        // -   <kbd>f</kbd> Full screen the video under the mouse cursor.
        videoFullScreenToggle(getVideoUnderCursor());
    } else if (["t", "T"].includes(event.key)) {
        // -   <kbd>t</kbd> Toggle thumbnail / video view.
        videoToggleThumbView();
    } else if ([">"].includes(event.key)) {
        // -   <kbd>></kbd> Speed up the track playback rate.
        videoSetPlaybackRateAll(+1);
    } else if (["<"].includes(event.key)) {
        // -   <kbd><</kbd> Slow down the track playback rate.
        videoSetPlaybackRateAll(-1);
    } else if (["?"].includes(event.key)) {
        // -   <kbd>?</kbd> Open help file.
        const helpFileURL = "./assets/videowall.js";
        window.open(helpFileURL);
    } else {
        return;
    }
}
