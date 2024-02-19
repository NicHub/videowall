#!/usr/bin/env python3

import os
import sys
import urllib.parse

# The file name must end with one of EXTENSIONS.
# If EXTENSIONS is empty, this test is skipped.
EXTENSIONS = ("mp4", "webm", "m4v")

# Files with this extensions are ignored.
IGNORED_EXTENSIONS = (".jpg", ".jpeg", ".html")

# The file name must not contain one of EXCLUDES.
# If EXCLUDES is empty, this test is skipped.
# If EXCLUDES contains only one element, this
# element must be followed by a comma,
# otherwise Python treats the tuple as a string.
EXCLUDES = ("novideowall",)

SCRIPT_PATH = os.path.dirname(os.path.abspath(__file__))
PLAYLIST_FILE_NAME = f"{SCRIPT_PATH}{os.path.sep}playlist.js"


def list_files(path_to_walk):
    """___"""

    filtered_files = []
    hidden_files = []
    non_supported_extension_files = []
    excluded_files = []

    for root, _, files in os.walk(path_to_walk):
        for file in files:
            # Make path name relative to this script.
            file_name = os.path.join(root, file)

            # Test if it is a hidden file.
            if file.startswith("."):
                hidden_files.append(os.path.abspath(file_name))
                continue

            # Test if file extension must be ignored.
            if len(IGNORED_EXTENSIONS) > 0 and file_name.lower().endswith(
                IGNORED_EXTENSIONS
            ):
                continue

            # Test if file extension is OK.
            if len(EXTENSIONS) > 0 and not file_name.lower().endswith(EXTENSIONS):
                non_supported_extension_files.append(os.path.abspath(file_name))
                continue

            # Test if exclude string found.
            exclude_found = False
            for exclude in EXCLUDES:
                if file_name.find(exclude) > -1:
                    exclude_found = True
                    excluded_files.append(os.path.abspath(file_name))
                    break
            if exclude_found:
                continue

            # If we arrived here, the file is OK.
            # Make its path name relative to videowall.html,
            # URL encode it with urllib.parse.quote,
            # and add it to the list.
            file_name = os.path.relpath(file_name, os.path.dirname(SCRIPT_PATH))
            file_name = urllib.parse.quote(file_name)
            filtered_files.append(file_name)

    # Sort the list of filtered files and return it.
    filtered_files.sort()
    filtered_files.reverse()
    files = {
        "filtered_files": filtered_files,
        "hidden_files": hidden_files,
        "non_supported_extension_files": non_supported_extension_files,
        "excluded_files": excluded_files,
    }
    return files


def make_playlist(filtered_files):
    """___"""

    # If the playlist is empty.
    if len(filtered_files) == 0:
        playlist = "PLAYLIST = []"
        print("WARNING: PLAYLIST IS EMPTY !")
        return playlist

    # If the playlist is not empty.
    playlist = '",\n    "'.join(filtered_files)
    playlist = f'PLAYLIST = [\n    "' f"{playlist}" f'"\n]\n'
    print(f"CREATING PLAYLIST WITH {len(filtered_files)} MOVIES.")
    return playlist


def save_playlist(playlist, file_name):
    """___"""

    f = open(file_name, "w")
    f.write(playlist)
    f.close()
    print(f'PLAYLIST SAVED IN "{os.path.abspath(file_name)}"')


def report_alien_files(files):
    """___"""

    """
    Avoid automatic `.DS_Store` creation :

    defaults write com.apple.desktopservices DSDontWriteNetworkStores true
    defaults write com.apple.desktopservices DSDontWriteUSBStores true

    defaults read com.apple.desktopservices DSDontWriteNetworkStores
    defaults read com.apple.desktopservices DSDontWriteUSBStores
    """

    # Print the list of hidden files.
    if len(files["hidden_files"]) > 0:
        msg = '" \\\n   "'.join(files["hidden_files"])
        msg = f'rm \\\n   "{msg}"'
        print(f'\n{len(files["hidden_files"])} HIDDEN FILE(S) FOUND:\n{msg}')

    # Print the list of files with non supported extentions.
    if len(files["non_supported_extension_files"]) > 0:
        print(
            f'\n{len(files["non_supported_extension_files"])} FILE(S)'
            "WITH NON SUPPORTED EXTENSION FOUND:"
        )
        print('"' + '"\n"'.join(files["non_supported_extension_files"]) + '"')

    # Print the list of files with excludes.
    if len(files["excluded_files"]) > 0:
        print(f'\n{len(files["excluded_files"])} FILE(S) WITH EXCLUDE STRING FOUND:')
        print('"' + '"\n"'.join(files["excluded_files"]) + '"')


def sanity_checks(target_directory):
    # Vérifie que le répertoire existe
    if not os.path.exists(target_directory) or not os.path.isdir(target_directory):
        print(f"Le répertoire n’existe pas : {target_directory}")
        sys.exit(1)


def main(target_directory=None):
    """___"""
    sanity_checks(target_directory)
    files = list_files(target_directory)
    playlist = make_playlist(files["filtered_files"])
    save_playlist(playlist, PLAYLIST_FILE_NAME)
    report_alien_files(files)


if __name__ == "__main__":
    target_directory = sys.argv[1] if len(sys.argv) > 1 else "../../videos/"
    main(target_directory)
