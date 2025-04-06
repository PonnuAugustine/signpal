import cv2
import os
import numpy as np
import gc


# Function to process videos efficiently
def process_videos(video_folder, output_folder, frame_skip=5, frame_size=(64, 64)):
    """
    Process videos from a folder, extracting frames with optimizations.

    Args:
    - video_folder (str): Path to the folder containing videos.
    - output_folder (str): Path to save processed frames.
    - frame_skip (int): Process every nth frame to reduce memory load.
    - frame_size (tuple): Resize frames to this size.
    """

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    video_files = [f for f in os.listdir(video_folder) if f.endswith(('.mp4', '.avi', '.mov'))]

    for video_file in video_files:
        video_path = os.path.join(video_folder, video_file)
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            print(f"Error: Unable to open {video_file}. Skipping...")
            continue  # Skip corrupted videos

        frame_count = 0
        saved_frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break  # End of video

            if frame_count % frame_skip == 0:
                # Resize frame
                frame_resized = cv2.resize(frame, frame_size)
                # Convert to grayscale (optional)
                frame_gray = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)

                # Save frame
                frame_filename = f"{video_file}_frame{saved_frame_count}.jpg"
                frame_path = os.path.join(output_folder, frame_filename)
                cv2.imwrite(frame_path, frame_gray)

                saved_frame_count += 1

            frame_count += 1

        # Release resources
        cap.release()
        gc.collect()  # Explicitly free memory

        print(f"Processed {saved_frame_count} frames from {video_file}")


# Example Usage
video_folder = r"E:\ponnu\signpal\dataset\MS-ASL\videos"
output_folder = r"E:\ponnu\signpal\dataset\MS-ASL\frames"

process_videos(video_folder, output_folder, frame_skip=5, frame_size=(64, 64))
