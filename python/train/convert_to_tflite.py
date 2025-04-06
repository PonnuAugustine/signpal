import tensorflow as tf

# Load the trained Keras model
model = tf.keras.models.load_model("asl_alphabet_mobilenetv2.h5")

# Convert the model to TensorFlow Lite format
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

# Save the TFLite model
with open("asl_alphabet_mobilenetv2.tflite", "wb") as f:
    f.write(tflite_model)

print("✅ Model successfully converted to TensorFlow Lite!")
