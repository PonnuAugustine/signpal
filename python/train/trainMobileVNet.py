import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np

# Define constants
IMAGE_SIZE = (128, 128, 3)
BATCH_SIZE = 32
EPOCHS = 15
NUM_CLASSES = 29  # ASL Alphabet has 29 classes
DATASET_PATH = r"E:\ponnu\signpal\dataset\ASL_Alphabet\asl_alphabet_train"

# Load preprocessed dataset
X_train, X_val, y_train, y_val = np.load("X_train.npy"), np.load("X_val.npy"), np.load("y_train.npy"), np.load("y_val.npy")

# Data Augmentation
train_datagen = ImageDataGenerator(
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True
)

val_datagen = ImageDataGenerator()

# Load MobileNetV2
base_model = MobileNetV2(input_shape=IMAGE_SIZE, include_top=False, weights='imagenet')
base_model.trainable = False  # Freeze base model weights

# Add custom layers
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.3)(x)
out = Dense(NUM_CLASSES, activation='softmax')(x)

# Build model
model = Model(inputs=base_model.input, outputs=out)
model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

# Train model
model.fit(
    train_datagen.flow(X_train, y_train, batch_size=BATCH_SIZE),
    validation_data=val_datagen.flow(X_val, y_val, batch_size=BATCH_SIZE),
    epochs=EPOCHS,
    verbose=1
)

# Save model
model.save("asl_alphabet_mobilenetv2.h5")
print("Model training complete! ✅")
