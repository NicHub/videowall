#!/usr/bin/env python3


import os
import signal
import sys

sys.path.append(".")
import make_playlist as mp
import make_movie_thumbnails as mt


def main():
    mp.main()
    mt.main("../../videos/")


def gracefull_KeyboardInterrupt():
    sys.excepthook = lambda type, value, traceback: (
        print("\r" "\033[2K" "\033[A", end="", flush=True)
        if issubclass(type, KeyboardInterrupt)
        else None
    )


if __name__ == "__main__":
    gracefull_KeyboardInterrupt()
    main()
    os.kill(os.getpid(), signal.SIGINT)


# #!/usr/bin/env bash

# # Usage:
# # chmod a+x make_playlist.command # Not needed on exFAT.
# # double click on file
# #
# # If Gatekeeper gets in the way, remove apple extended attributes manually
# # xattr -c make_playlist.command

# # https://stackoverflow.com/a/29710607

# cd -- "$(dirname "$0")"

# /usr/bin/env python3 ./make_playlist.py

# kill -s INT $$
