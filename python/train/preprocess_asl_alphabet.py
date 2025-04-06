import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from tqdm import tqdm  # Progress bar

# Define constants
IMAGE_SIZE = (128, 128)  # Resize for memory efficiency
DATASET_PATH = r"E:\ponnu\signpal\dataset\ASL_Alphabet\asl_alphabet_train"  # Update your path
NUM_CLASSES = 29  # ASL Alphabet has 29 classes
BATCH_SIZE = 1000  # Process images in batches
SAVE_PATH = r"E:\ponnu\signpal\train"  # Path to save processed dataset


def load_asl_alphabet_dataset():
    images = []
    labels = []
    class_names = sorted(os.listdir(DATASET_PATH))  # Get class names from folders
    print("Classes found:", class_names)

    for class_index, class_name in enumerate(class_names):
        class_folder = os.path.join(DATASET_PATH, class_name)
        if os.path.isdir(class_folder):
            print(f"Loading images for class: {class_name}")
            image_files = os.listdir(class_folder)

            for i in tqdm(range(0, len(image_files), BATCH_SIZE), desc=f"Processing {class_name}"):
                batch_files = image_files[i:i + BATCH_SIZE]
                batch_images = []
                batch_labels = []

                for img_name in batch_files:
                    img_path = os.path.join(class_folder, img_name)
                    try:
                        img = cv2.imread(img_path, cv2.IMREAD_COLOR)  # Read image
                        if img is None:
                            print(f"Skipping unreadable image: {img_path}")
                            continue  # Skip corrupted images

                        img = cv2.resize(img, IMAGE_SIZE)  # Resize image
                        img = img.astype(np.float32) / 255.0  # Normalize (float32 for model compatibility)

                        batch_images.append(img)
                        batch_labels.append(class_index)

                    except Exception as e:
                        print(f"Error loading image {img_path}: {e}")  # Log error but continue

                images.extend(batch_images)
                labels.extend(batch_labels)

    images = np.array(images, dtype=np.float32)  # Convert to NumPy array
    labels = np.array(labels)

    print(f"Loaded {len(images)} images in total.")
    return images, labels, class_names


# Load data
images, labels, class_names = load_asl_alphabet_dataset()

# Convert labels to one-hot encoding
labels = to_categorical(labels, num_classes=NUM_CLASSES)

# Shuffle data
indices = np.arange(len(images))
np.random.shuffle(indices)
images, labels = images[indices], labels[indices]

# Split data into training (80%) and validation (20%)
X_train, X_val, y_train, y_val = train_test_split(images, labels, test_size=0.2, random_state=42,
                                                  stratify=np.argmax(labels, axis=1))

# Save the preprocessed dataset
if not os.path.exists(SAVE_PATH):
    os.makedirs(SAVE_PATH)

np.save(os.path.join(SAVE_PATH, "X_train.npy"), X_train)
np.save(os.path.join(SAVE_PATH, "X_val.npy"), X_val)
np.save(os.path.join(SAVE_PATH, "y_train.npy"), y_train)
np.save(os.path.join(SAVE_PATH, "y_val.npy"), y_val)

# Print dataset info
print(f"Total images: {len(images)}")
print(f"Training images: {len(X_train)}, Validation images: {len(X_val)}")
print(f"Class names: {class_names}")
print("Dataset saved successfully!")
