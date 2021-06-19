#!/usr/bin/env python3

import os


# The file name must end with one of EXTENSIONS.
# If EXTENSIONS is empty, this test is skipped.
EXTENSIONS = ("mp4", "webm", "m4v")

# The file name must not contain one of EXCLUDES.
# If EXCLUDES is empty, this test is skipped.
EXCLUDES = ("novideowall", "404.mp4", "empty.mp4")

PATH_TO_WALK = "../../videos/"
FILE_NAME = "playlist.js"


def list_files(path_to_walk):
    """ ___ """

    filtered_files = []
    for root, _, files in os.walk(path_to_walk):
        for file in files:

            # Make path name relative to this script.
            file_name = os.path.join(root, file)

            # Test if it is a hidden file.
            if file.startswith("."):
                print(f'Hidden file found:\n"{file_name}"')
                continue

            # Test if file extension is OK.
            if len(EXTENSIONS) > 0 and not file_name.endswith(EXTENSIONS):
                print(f'File with non supported extension found:\n"{file_name}"')
                continue

            # Test if exclude string found.
            exclude_found = False
            for exclude in EXCLUDES:
                if file_name.find(exclude) > -1:
                    exclude_found = True
                    print(f'File with exclude string found:\n"{file_name}"')
                    break
            if exclude_found:
                continue

            # If we arrived here, the file is OK.
            # Make its path name relative to videowall.html
            # and add it to the list.
            file_name = file_name[3:]
            filtered_files.append(file_name)

    filtered_files.sort()
    return filtered_files


def make_playlist(filtered_files):
    """ ___ """

    # If the playlist is empty.
    if len(filtered_files) == 0:
        playlist = "playlist = []"
        return playlist

    # If the playlist is not empty.
    playlist = '",\n    "'.join(filtered_files)
    playlist = (
        f'playlist = [\n    "'
        f"{playlist}"
        f'"\n]\n'
    )
    return playlist


def save_playlist(playlist, file_name):
    """ ___ """

    f = open(file_name, "w")
    f.write(playlist)
    f.close()


if __name__ == "__main__":

    filtered_files = list_files(PATH_TO_WALK)
    playlist = make_playlist(filtered_files)
    save_playlist(playlist, FILE_NAME)
