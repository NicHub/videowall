"use strict";

const ORIGINAL_DOC_TITLE = document.title;
const BEGIN_AT = STARTUP_DEFAULTS["BEGIN_AT"];
const NB_VIDEOS_MAX = STARTUP_DEFAULTS["NB_VIDEOS_MAX"];
var V_ATTR = {
    controls: undefined,
    autoplay: undefined,
    muted: undefined,
};
var IS_PLAYING = undefined;
var ALLOWED_NB_VIDEOS = [];
var ALL_VIDEOS = [];
var VIDEO_TEMPLATE = document.getElementById("v0");
var MOVIE_ORDERS = [];
var NB_VIDEOS = STARTUP_DEFAULTS["NB_VIDEOS"];

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
    if (typeof playlist === "undefined") {
        container.innerHTML = `
<p>The file playlist.js cannot be found! You have to create "<code>assets/playlist.js</code>" with the following content:</p>
<pre>playlist <span class="pl-k">=</span> [
    <span class="pl-s"><span class="pl-pds">"</span>../file_1.mp4<span class="pl-pds">"</span></span>,
    <span class="pl-s"><span class="pl-pds">"</span>../file_2.mp4<span class="pl-pds">"</span></span>
    ]</pre>`;
        return;
    }

    // Abort if the playlist is empty.
    if (playlist.length === 0) {
        container.innerHTML = "<p>Playlist is empty. Aborting.</p>";
        return;
    }

    // Create the <style> element that will by modified when the layout changes.
    const style = document.createElement("style");
    style.id = "created_by_js";
    const head = document.getElementsByTagName("head")[0];
    head.appendChild(style);

    // Add the class ".modified_by_js" to the video template.
    VIDEO_TEMPLATE.classList.add("modified_by_js");

    // Set document title.
    document.title = `${ORIGINAL_DOC_TITLE} | ${playlist.length} VIDEOS`;

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
        .addEventListener("keyup", keyboardShortcutsManagement);

    // Let’s begin the serious stuff.
    main();
}

/**
 *
 */
function main() {
    // Create the CSS style according to the current layout.
    const _w = NB_VIDEOS === 2 ? 50 : 100 / Math.sqrt(NB_VIDEOS);
    const _h = NB_VIDEOS === 2 ? 100 : _w;
    document.getElementById(
        "created_by_js"
    ).innerHTML = `.modified_by_js {width: ${_w}%; height: ${_h}vh;}`;

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
        for (let key = index; key < playlist.length; key += NB_VIDEOS) {
            moviepathids.push(key);
        }
        _video.setAttribute("data-moviepathids", moviepathids);

        // `moviepathid` is the index of the current video.
        _video.setAttribute("data-moviepathid", index);

        // Add wheel event.
        _video.addEventListener(
            "wheel",
            function () {
                nextVideo(this, event.deltaY < 0 ? -1 : +1);
            },
            false
        );

        // Add ended event.
        _video.addEventListener(
            "ended",
            function () {
                nextVideo(this, 1);
            },
            false
        );

        // Drag and drop for reordering by user.
        _video.draggable = false; // TODO: Drag and drop don’t work as expected yet.
        _video.ondragend = function () {
            onDragEnd(_video.id);
        };

        // Set video source and play.
        setVideoSrcAndPlay(_video, playlist[index]);
    }
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        const index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        const temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

/**
 * Play next or previous video with mouse wheel event.
 */
function nextVideoAll(increment) {
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];
        nextVideo(_video, increment);
    }
}

/**
 * Play next or previous video with mouse wheel event.
 */
function nextVideo(_video, increment) {
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
    setVideoSrcAndPlay(_video, playlist[newmoviepathid]);
}

/**
 *
 */
function setVideoSrcAndPlay(_video, _src) {
    _video.addEventListener("error", function () {
        console.log(`Error: ${_src}`);
        _video.src = "./assets/404.mp4";
    });

    _video.addEventListener(
        "loadeddata",
        function () {
            _video.currentTime = parseInt(_video.duration * BEGIN_AT);
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
    console.log(`Playing: ${_src}`);
}

/**
 *
 */
function changeLayout(layout_id) {
    if (NB_VIDEOS_MAX < 2) return;

    const cur_id = ALLOWED_NB_VIDEOS.indexOf(NB_VIDEOS);
    const nb_id = ALLOWED_NB_VIDEOS.length;
    let next_id;
    if (layout_id == "increase") {
        next_id = (cur_id + 1) % nb_id;
    } else if (layout_id == "decrease") {
        next_id = cur_id - 1;
        next_id = next_id >= 0 ? next_id : nb_id - 1;
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
function videoPlayPauseAllToggle() {
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
function videoPause(video) {
    if (!video) {
        return;
    }
    const play_promise = video.pause();
    if (play_promise !== undefined) {
        play_promise.catch((_) => {});
    }
}

/**
 *
 */
function getVideoUnderCursor() {
    let _video = document.querySelector("video:hover");
    if (_video === void 0) {
        _video = false;
    }
    return _video;
}

/**
 * To go to the end, set time = -1
 */
function videoGoToTime(video, time) {
    if (!video) {
        return;
    }
    if (time === -1) {
        time = video.duration;
        video.pause();
    }
    video.currentTime = parseInt(time);
}

/**
 *
 */
function videoGoForwardOrBackward(video, dT) {
    if (!video) {
        return;
    }
    video.currentTime = parseInt(video.currentTime + dT);
}

/**
 *
 */
function videoMuteToggle(video) {
    if (!video) {
        return;
    }
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];
        if (_video.id === video.id) {
            video.muted = !video.muted;
        } else {
            _video.muted = true;
        }
    }
}

/**
 *
 */
function videoFullScreenToggle(video) {
    if (!video) {
        return;
    }
    for (let index = 0; index < NB_VIDEOS; index++) {
        const _video = ALL_VIDEOS[index];
        if (_video.id !== video.id) {
            videoPause(_video);
        }
    }
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
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
    const source_moviepath = playlist[source_moviepathid];
    const target_moviepath = playlist[target_moviepathid];
    playlist[source_moviepathid] = target_moviepath;
    playlist[target_moviepathid] = source_moviepath;
    main();
}

/**
 *
 */
function updateClipboard(newClip) {
    navigator.clipboard.writeText(newClip).then(
        function () {
            // Clipboard successfully set.
        },
        function () {
            // Clipboard write failed.
        }
    );
}

/**
 *
 */
function keyboardShortcutsManagement(event) {
    if (["ArrowUp"].includes(event.key)) {
        changeLayout("increase");
    } else if (["ArrowDown"].includes(event.key)) {
        changeLayout("decrease");
    } else if (!isNaN(event.key)) {
        changeLayout(parseInt(event.key));
    } else if (["ArrowRight"].includes(event.key)) {
        nextVideoAll(1);
    } else if (["ArrowLeft"].includes(event.key)) {
        nextVideoAll(-1);
    } else if (["s"].includes(event.key)) {
        playlist = shuffle(playlist);
        main();
    } else if (["o"].includes(event.key)) {
        const video = getVideoUnderCursor();
        let path = video.src.substring(7);
        try {
            path = decodeURI(path);
        } catch (e) {
            console.error(e);
        }
        path = path.replace(/%23/g, "#");
        if (window.navigator.platform in ["Win32"]) {
            path = path.replace(/\//g, "\\");
        }
        console.log(path);
        updateClipboard(`"${path}"`);
        window.open(video.src);
    } else if (["Home"].includes(event.key)) {
        videoGoToTime(getVideoUnderCursor(), 0);
    } else if (["End"].includes(event.key)) {
        videoGoToTime(getVideoUnderCursor(), -1);
    } else if (["j"].includes(event.key)) {
        videoGoForwardOrBackward(getVideoUnderCursor(), -10);
    } else if ([" ", "k"].includes(event.key)) {
        videoPlayPauseAllToggle();
    } else if (["l"].includes(event.key)) {
        videoGoForwardOrBackward(getVideoUnderCursor(), +10);
    } else if (["m"].includes(event.key)) {
        videoMuteToggle(getVideoUnderCursor());
    } else if (["f"].includes(event.key)) {
        videoFullScreenToggle(getVideoUnderCursor());
    } else {
        return;
    }
}
