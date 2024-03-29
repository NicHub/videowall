"""

"""

import os
import sys
from invoke import run
import signal

THUMB_DIR = "thumbs"
FORCE_CREATE = False


def __quit_gracefully(_, __):
    # Do here whatever is needed to quit the program gracefully.
    print("\b\b\033[K", end="", flush=True)
    exit(0)


def __quit_gracefully_init():
    # Choose the signals that will stop the program if they are
    # available on the current platform.
    # E.g. SIGQUIT is available on macOS but not on Windows.
    signal_names = [
        signal_name
        for signal_name in ("SIGINT", "SIGQUIT", "SIGTERM")
        if signal_name in dir(signal.Signals)
    ]
    # Assign handler to signals.
    for signal_name in signal_names:
        signal.signal(getattr(signal, signal_name), __quit_gracefully)


def capture_snapshot(video_path, output_path):
    cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {video_path}"
    result = run(cmd, hide=True, warn=True)
    half_duration = float(result.stdout.strip()) / 2
    print(f"{half_duration:10.1f} s     {output_path}")
    img_w, img_h = (250, int(250 * 9 / 16))
    cmd = (
        f"ffmpeg -y -ss {half_duration} -i {video_path} -frames:v 1"
        f' -q:v 2 -vf "scale={img_w}:{img_h}:force_original_aspect_ratio=increase,crop={img_w}:{img_h}"'
        f" {output_path}"
    )
    result = run(cmd, hide=True, warn=True)


def capture_snapshot_video(input_jpeg_path, output_video_path):
    # cmd = (
    #     f"ffmpeg -y -hide_banner -loglevel panic -loop 1 -i "
    #     f" {input_jpeg_path} -c:v libx264 -t 10 -pix_fmt yuv420p"
    #     f" -vf scale=1280:720"
    #     f" {output_video_path}"
    # )
    cmd = (
        f"""ffmpeg -y -hide_banner -loglevel panic -loop 1 -i"""
        f""" {input_jpeg_path} -c:v libx264 -t 10 -pix_fmt yuv420p"""
        f""" -vf "scale=1280:720,setpts='if(eq(N,0),0,PTS)'"""
        f""" {output_video_path}"""
    )
    result = run(cmd, hide=True, warn=True)
    print(result)


def process_videos(directory):
    for root, _, files in sorted(os.walk(directory)):
        # Don’t scan the thumb dir itself.
        if THUMB_DIR in root:
            continue

        # List files of interest.
        files = [file for file in files if file.lower().endswith((".mp4", ".m4v"))]
        files = [file for file in files if "nothumb" not in file]

        # Create thumb dir if needed.
        thumb_dir = root + os.path.sep + THUMB_DIR + os.path.sep
        if len(files) > 0:
            os.makedirs(thumb_dir, exist_ok=True)

        # Remove thumbs that are no longer needed.
        for t_root, _, t_files in sorted(os.walk(thumb_dir)):
            for t_file in t_files:
                if os.path.splitext(t_file)[0] in files:
                    continue
                fname = t_root + t_file
                print(f"{fname} shall not be here, remove it")
                try:
                    os.remove(fname)
                except Exception:
                    print(f"error while deleting {fname}")

        # Create thumbs if needed.
        for file in sorted(files):
            video_path = os.path.join(root, file)
            fname = os.path.basename(video_path)
            snapshot_path = thumb_dir + fname + ".jpg"
            if os.path.exists(snapshot_path) and not FORCE_CREATE:
                continue
            capture_snapshot(video_path, snapshot_path)

            # Thumb in video format (legacy, not used).
            do_capture_snapshot_video = False
            if do_capture_snapshot_video:
                output_video_path = snapshot_path + ".mp4"
                print(f"output_video_path = {output_video_path}")
                capture_snapshot_video(snapshot_path, output_video_path)


def generate_html(directory):
    """
    Legacy code. Not used anymore.
    The gallery is now included in the videowall itself.
    """
    image_files = []
    for root, _, files in sorted(os.walk(directory)):
        for file in sorted(files):
            if file.lower().endswith((".jpg")):
                image_files.append(os.path.join(root, file))

    # Début de la page HTML
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{len(image_files)} vidéos</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link rel="shortcut icon" type="image/x-icon" href="../videowall/assets/favicon.ico">
<style>
    body {{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        background-color: black;
    }}

    img {{
        width: 150px;
        height: auto;
        margin: 5px 5px 0 0;
        padding: 0;
    }}
</style>
<title>Q</title>
</head>
<body>
"""

    # Ajoute une balise img pour chaque image
    for image_file in image_files:
        video_file = image_file.replace(THUMB_DIR + os.path.sep, "")
        video_file = os.path.splitext(video_file)[0]
        html_content += (
            f'<a target="_blank" href="{video_file}"><img src="{image_file}"></a>\n'
        )

    # Fin de la page HTML
    html_content += "</body></html>"

    # Écrit le contenu HTML dans un fichier
    with open(directory + "q.html", "w") as html_file:
        html_file.write(html_content)


def sanity_checks(target_directory):
    # Vérifie que le répertoire existe
    if not os.path.exists(target_directory) or not os.path.isdir(target_directory):
        print(f"Le répertoire n’existe pas : {target_directory}")
        sys.exit(1)


def main(target_directory=None):
    sanity_checks(target_directory)
    process_videos(target_directory)
    # generate_html(target_directory)
    print("DONE MAKING MOVIE THUMBNAILS")


if __name__ == "__main__":
    __quit_gracefully_init()
    target_directory = sys.argv[1] if len(sys.argv) > 1 else "../../videos/"
    main(target_directory)
