package com.example.practice;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.*;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.common.util.concurrent.ListenableFuture;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity2 extends AppCompatActivity {

    private PreviewView cameraPreview;
    private TextView tvRecognizedText;
    private ExecutorService cameraExecutor;
    private static final int CAMERA_PERMISSION_CODE = 100;
    private boolean isFrontCamera = false;
    private Interpreter tfliteInterpreter;
    private TextToSpeech textToSpeech;

    private static final int IMAGE_SIZE = 128;
    private static final String MODEL_FILE = "asl_alphabet_mobilenetv2.tflite";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main2);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        cameraPreview = findViewById(R.id.previewView);
        tvRecognizedText = findViewById(R.id.tvRecognizedText);
        Button btnSwitchCamera = findViewById(R.id.btnSwitchCamera);

        cameraExecutor = Executors.newSingleThreadExecutor();

        // Load TFLite model
        try {
            tfliteInterpreter = new Interpreter(TFLiteLoader.loadModelFile(this, MODEL_FILE));
            Log.d("TFLite", "Model loaded successfully.");
        } catch (Exception e) {
            Log.e("TFLite", "Failed to load model: " + e.getMessage());
        }

        // Initialize Text-to-Speech
        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = textToSpeech.setLanguage(Locale.US);
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e("TTS", "Language not supported");
                } else {
                    Log.d("TTS", "Text-to-Speech initialized");
                }
            } else {
                Log.e("TTS", "Initialization failed");
            }
        });

        // Check camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        } else {
            startCamera(isFrontCamera);
        }

        // Switch camera button
        btnSwitchCamera.setOnClickListener(v -> {
            isFrontCamera = !isFrontCamera;
            startCamera(isFrontCamera);
        });
    }

    private void startCamera(boolean useFrontCamera) {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                cameraProvider.unbindAll();

                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(cameraPreview.getSurfaceProvider());

                CameraSelector cameraSelector = new CameraSelector.Builder()
                        .requireLensFacing(useFrontCamera ? CameraSelector.LENS_FACING_FRONT : CameraSelector.LENS_FACING_BACK)
                        .build();

                ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build();

                imageAnalysis.setAnalyzer(cameraExecutor, image -> {
                    Bitmap bitmap = null;
                    try {
                        bitmap = BitmapUtils.imageToBitmap(image);
                        if (bitmap != null) {
                            bitmap = Bitmap.createScaledBitmap(bitmap, IMAGE_SIZE, IMAGE_SIZE, true);
                            String prediction = recognizeSign(bitmap);
                            Log.d("Analyzer", "Prediction: " + prediction);
                            runOnUiThread(() -> {
                                tvRecognizedText.setText(prediction);
                                //if (textToSpeech != null && !prediction.isEmpty()) {
                                    //textToSpeech.speak(prediction, TextToSpeech.QUEUE_FLUSH, null, null);
                                //}
                            });
                        } else {
                            Log.e("Analyzer", "Bitmap conversion returned null");
                            runOnUiThread(() -> tvRecognizedText.setText("Failed to capture image"));
                        }
                    } catch (Exception e) {
                        Log.e("Analyzer", "Error in analysis: " + e.getMessage());
                        runOnUiThread(() -> tvRecognizedText.setText("Prediction failed"));
                    } finally {
                        image.close();
                    }
                });

                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis);

            } catch (Exception e) {
                Log.e("CameraX", "Camera binding failed: " + e.getMessage());
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private String recognizeSign(Bitmap bitmap) {
        if (bitmap == null) {
            Log.e("Prediction", "Bitmap is null in recognizeSign");
            return "No image";
        }

        if (tfliteInterpreter == null) {
            Log.e("Prediction", "Interpreter is null");
            return "Model not loaded";
        }

        try {
            ByteBuffer inputBuffer = ByteBuffer.allocateDirect(1 * IMAGE_SIZE * IMAGE_SIZE * 3 * 4);
            inputBuffer.order(ByteOrder.nativeOrder());

            int[] intValues = new int[IMAGE_SIZE * IMAGE_SIZE];
            bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());

            for (int pixel : intValues) {
                inputBuffer.putFloat(((pixel >> 16) & 0xFF) / 255.0f);
                inputBuffer.putFloat(((pixel >> 8) & 0xFF) / 255.0f);
                inputBuffer.putFloat((pixel & 0xFF) / 255.0f);
            }

            TensorBuffer outputBuffer = TensorBuffer.createFixedSize(new int[]{1, 29}, org.tensorflow.lite.DataType.FLOAT32);
            tfliteInterpreter.run(inputBuffer, outputBuffer.getBuffer());

            float[] confidenceScores = outputBuffer.getFloatArray();
            int maxIndex = 0;
            for (int i = 1; i < confidenceScores.length; i++) {
                if (confidenceScores[i] > confidenceScores[maxIndex]) {
                    maxIndex = i;
                }
            }

            Log.d("Prediction", "Max confidence index: " + maxIndex + ", value: " + confidenceScores[maxIndex]);
            return SignLabels.getLabel(maxIndex);

        } catch (Exception e) {
            Log.e("Prediction", "Error during prediction: " + e.getMessage());
            return "Prediction failed";
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cameraExecutor.shutdown();
        if (tfliteInterpreter != null) {
            tfliteInterpreter.close();
        }
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
    }
}
