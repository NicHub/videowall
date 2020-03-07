"use strict";

const begin_at = 1 / 4;
const nb_videos = 9;

main();

/***
 * Main
 **/
function main() {

    var container = document.getElementById("container");
    var video_elem = document.getElementById("v0");

    // Duplicate video element.
    for (let index = 1; index < nb_videos; index++) {
        let new_video = video_elem.cloneNode(true);
        new_video.id = "v" + index;
        container.appendChild(new_video);
    }

    // Prepare each video.
    var all_videos = container.getElementsByTagName("video");
    for (let index = 0; index < nb_videos; index++) {

        let _video = all_videos[index];

        // Set movie metadata.
        _video.setAttribute('data-videoid', index);
        _video.setAttribute('data-moviepathid', index);

        // Add wheel event.
        _video.addEventListener('wheel', nextVideo, false);

        // Add ended event.
        _video.addEventListener('ended', nextVideo, false);

        // Set video source and play.
        setVideoSrcAndPlay(_video, playlist[index]);
    }
}

/***
 *
 **/
function nextVideo() {
    // Play next or previous video with mouse wheel event.
    let _video = this;

    // Get and Set movie metadata.
    let videoid = parseInt(_video.getAttribute('data-videoid'));
    let moviepathid = parseInt(_video.getAttribute('data-moviepathid'));
    let increment = event.deltaY > 0 ? +nb_videos : -nb_videos;
    let newmoviepathid = moviepathid + increment;
    if (newmoviepathid < 0)
        newmoviepathid = playlist.length - 1 + newmoviepathid;
    if (newmoviepathid > (playlist.length - 1))
        newmoviepathid = videoid;
    _video.setAttribute('data-moviepathid', newmoviepathid);

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
    _video.addEventListener('loadeddata', function () {
        _video.currentTime = parseInt(_video.duration * begin_at);
        var playPromise = _video.play();
        if (playPromise !== undefined) {
            playPromise.catch(_ => {});
        }
    }, false);
}
