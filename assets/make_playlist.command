#!/usr/bin/env python3


import os
import signal
import sys


import make_playlist as mp
import make_movie_thumbnails as mt


def main():
    mp.main("../../videos/")
    mt.main("../../videos/")


def gracefull_KeyboardInterrupt():
    sys.excepthook = lambda type, value, traceback: (
        print("\r" "\033[2K" "\033[A", end="", flush=True)
        if issubclass(type, KeyboardInterrupt)
        else None
    )


if __name__ == "__main__":
    PATHNAME = os.path.realpath(os.path.dirname(__file__))
    os.chdir(PATHNAME)
    gracefull_KeyboardInterrupt()
    main()
    os.kill(os.getpid(), signal.SIGINT)
