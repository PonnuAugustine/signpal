package com.example.practice;

public class SignLabels {
    private static final String[] labels = {
            "A", "B", "C", "D", "E", "F", "G", "H", "I",
            "J", "K", "L", "M", "N", "O", "P", "Q", "R",
            "S", "T", "U", "V", "W", "X", "Y", "Z", "space", "delete", "nothing"
    };

    public static String getLabel(int index) {
        if (index >= 0 && index < labels.length) {
            return labels[index];
        } else {
            return "Unknown";
        }
    }
}
