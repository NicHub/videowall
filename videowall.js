"use strict";

const begin_at = 1 / 4;
var nb_videos = 9;
const allowed_nb_videos = [1, 2, 4, 9, 16, 25, 36, 49, 64, 81];
var all_videos;

main(nb_videos);

/***
 * Main
 **/
function main(nb_videos) {

    var container = document.getElementById("container");
    var video_elem = document.getElementById("v0");
    var last_video = video_elem;

    // Test if nb_videos makes sense.
    if (!allowed_nb_videos.includes(nb_videos)) {
        container.innerHTML = `nb_videos = ${nb_videos}, but must be in [${allowed_nb_videos}]`
        return;
    }

    // Remove current videos.
    var cur_videos = document.getElementsByTagName("video");
    for (let cnt = cur_videos.length - 1; cnt >= 0; cnt--) {
        if (cur_videos[cnt].id !== "v0") {
            cur_videos[cnt].parentNode.removeChild(cur_videos[cnt]);
        }
    }

    // Change css class of video.
    video_elem.classList = `nb_videos_${nb_videos}`;

    // Key listener.
    container.addEventListener("keyup", keyboard_shortcuts_management);

    // Duplicate video element.
    all_videos = [video_elem];
    for (let index = 1; index < nb_videos; index++) {
        let _video = video_elem.cloneNode(true);
        _video.id = "v" + index;
        if (video_elem.hasAttribute("muted")) _video.muted = true; // For FF.
        video_elem.parentNode.insertBefore(_video, last_video.nextSibling);
        last_video = _video;
        all_videos.push(_video);
    }

    // Prepare each video.
    for (let index = 0; index < nb_videos; index++) {

        let _video = all_videos[index];

        // Set movie metadata.
        // `moviepathidskey` is the current index in the `moviepathids` array.
        _video.setAttribute("data-moviepathidskey", 0);

        // `moviepathids` is an array that contains the indexes of
        // the videos that the current player can play.
        let moviepathids = [];
        for (let key = index; key < playlist.length; key += nb_videos) {
            moviepathids.push(key);
        }
        _video.setAttribute("data-moviepathids", moviepathids);

        // `moviepathid` is the index of the current video.
        _video.setAttribute("data-moviepathid", index);

        // Add wheel event.
        _video.addEventListener("wheel", function () { nextVideo(this, event.deltaY < 0 ? -1 : +1) }, false);

        // Add ended event.
        _video.addEventListener("ended", function () { nextVideo(this, 1) }, false);

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
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

/***
 * Play next or previous video with mouse wheel event.
 **/
function nextVideo_all(increment) {

    for (let index = 0; index < nb_videos; index++) {
        let _video = all_videos[index];
        nextVideo(_video, increment)
    }
}

/***
 * Play next or previous video with mouse wheel event.
 **/
function nextVideo(_video, increment) {

    // Get and Set movie metadata.
    let moviepathidskey = parseInt(_video.getAttribute("data-moviepathidskey"));
    let moviepathids = _video.getAttribute("data-moviepathids").split(",");
    // let increment = event.deltaY < 0 ? -1 : +1; // If event.deltaY is undefined, then increment will be 1;
    moviepathidskey = (moviepathidskey + increment) % (moviepathids.length);
    moviepathidskey = moviepathidskey < 0 ? (moviepathids.length + moviepathidskey) : moviepathidskey;
    _video.setAttribute("data-moviepathidskey", moviepathidskey);
    _video.setAttribute("data-moviepathids", moviepathids);
    let newmoviepathid = parseInt(moviepathids[moviepathidskey]);
    _video.setAttribute("data-moviepathid", newmoviepathid);

    // Set video source and play.
    setVideoSrcAndPlay(_video, playlist[newmoviepathid]);
}

/***
 *
 **/
function setVideoSrcAndPlay(_video, _src) {

    // Set movie src.
    _video.getElementsByTagName("source")[0].src = _src;

    // Load, set movie position in time and play.
    _video.load();
    _video.addEventListener("loadeddata", function () {
        _video.currentTime = parseInt(_video.duration * begin_at);
        var playPromise = _video.play();
        if (playPromise !== undefined) {
            playPromise.catch(_ => { });
        }
    }, false);
}

/***
 *
 **/
function change_layout(layout_id) {

    const cur_id = allowed_nb_videos.indexOf(nb_videos);
    const nb_id = allowed_nb_videos.length;
    var next_id;
    if (layout_id == "increase") {
        next_id = (cur_id + 1) % nb_id;
    }
    else if (layout_id == "decrease") {
        next_id = (cur_id - 1);
        next_id = (next_id >= 0) ? next_id : nb_id - 1;
    }
    else if (layout_id >= 0 && layout_id < allowed_nb_videos.length) {
        next_id = layout_id;
    }
    else {
        return;
    }

    nb_videos = allowed_nb_videos[next_id];
    main(nb_videos);
}

/***
 *
 **/
function togglePlayPauseAll() {

    for (let index = 0; index < nb_videos; index++) {
        let _video = all_videos[index];
        const isVideoPlaying = !!(_video.currentTime > 0 && !_video.paused && !_video.ended && _video.readyState > 2);
        if (isVideoPlaying) {
            var playPromise = _video.pause();
            if (playPromise !== undefined) {
                playPromise.catch(_ => { });
            }
        }
        else {
            var playPromise = _video.play();
            if (playPromise !== undefined) {
                playPromise.catch(_ => { });
            }
        }
    }
}

/***
 *
 **/
function keyboard_shortcuts_management(event) {

    if (["ArrowUp"].includes(event.key)) {
        change_layout("increase");
    }
    else if (["ArrowDown"].includes(event.key)) {
        change_layout("decrease");
    }
    else if (!isNaN(event.key)) {
        change_layout(parseInt(event.key));
    }
    else if (["ArrowRight"].includes(event.key)) {
        nextVideo_all(1);
    }
    else if (["ArrowLeft"].includes(event.key)) {
        nextVideo_all(-1);
    }
    else if (["k"].includes(event.key)) {
        togglePlayPauseAll();
    }
    else if (["s"].includes(event.key)) {
        playlist = shuffle(playlist);
        main(nb_videos);
    }
    else {
        return;
    }
}
