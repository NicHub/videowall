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
        video_elem.parentNode.insertBefore(new_video, video_elem);
    }

    // Prepare each video.
    var all_videos = container.getElementsByTagName("video");
    var remainder = playlist.length % nb_videos;
    for (let index = 0; index < nb_videos; index++) {

        let _video = all_videos[index];

        // Set movie metadata.      
        // `moviepathidskey` is the current index in the `moviepathids` array.
        _video.setAttribute('data-moviepathidskey', 0);

        // `moviepathids` is an array that contains the indexes of 
        // the videos that the current video can play.
        let moviepathids = [];
        for (let key = index; key < playlist.length; key += nb_videos) {
            moviepathids.push(key);
        }
        _video.setAttribute('data-moviepathids', moviepathids);

        // `moviepathid` is the index of the current video.
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
    let moviepathidskey = parseInt(_video.getAttribute('data-moviepathidskey'));
    let moviepathids = _video.getAttribute('data-moviepathids').split(",");
    let increment = event.deltaY < 0 ? -1 : +1; // If event.deltaY is undefined, then increment will be 1;
    console.log(`increment: ${increment}`);
    moviepathidskey = (moviepathidskey + increment) % (moviepathids.length);
    moviepathidskey = moviepathidskey < 0 ? (moviepathids.length + moviepathidskey) : moviepathidskey;
    _video.setAttribute('data-moviepathidskey', moviepathidskey);
    _video.setAttribute('data-moviepathids', moviepathids);
    let newmoviepathid = parseInt(moviepathids[moviepathidskey]);
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
            playPromise.catch(_ => { });
        }
    }, false);
}
