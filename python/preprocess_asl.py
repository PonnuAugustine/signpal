import os
import cv2

IMG_SIZE = 64
TRAIN_DATASET_PATH = "E:/ponnu/signpal/dataset/ASL_Alphabet/asl_alphabet_train"


def load_data(dataset_path):
    if not os.path.exists(dataset_path):
        print(f"Error: {dataset_path} does not exist")
        return []

    labels = sorted(os.listdir(dataset_path))  # Get class names (A-Z)
    data = []

    for label in labels:
        label_path = os.path.join(dataset_path, label)
        if not os.path.isdir(label_path):
            continue  # Skip non-folder files

        print(f"Processing label: {label}")  # ✅ Debugging print

        for img_file in os.listdir(label_path):
            img_path = os.path.join(label_path, img_file)
            print(f"Reading: {img_path}")  # ✅ Debugging print

            img = cv2.imread(img_path)
            if img is None:
                print(f"❌ Cannot read {img_path}, skipping")
                continue

            img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
            data.append((img, label))

    return data


train_data = load_data(TRAIN_DATASET_PATH)
print(f"✅ Loaded {len(train_data)} training images")
