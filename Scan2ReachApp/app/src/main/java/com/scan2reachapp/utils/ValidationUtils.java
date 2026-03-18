package com.scan2reachapp.utils;

import android.util.Patterns;

public class ValidationUtils {

    /**
     * Validate email address
     */
    public static boolean isValidEmail(String email) {
        return email != null 
            && !email.trim().isEmpty() 
            && Patterns.EMAIL_ADDRESS.matcher(email).matches();
    }

    /**
     * Validate phone number (Indian format)
     */
    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        
        // Remove spaces and special characters
        String cleanPhone = phone.replaceAll("[\\s()-+]", "");
        
        // Check if it's 10 digits (Indian mobile)
        if (cleanPhone.length() == 10 && cleanPhone.matches("^[6-9]\\d{9}$")) {
            return true;
        }
        
        // Check if it starts with +91 and has 10 digits after
        if (cleanPhone.length() == 13 && cleanPhone.startsWith("+91")) {
            return cleanPhone.substring(3).matches("^[6-9]\\d{9}$");
        }
        
        // Check if it starts with 91 and has 10 digits after
        if (cleanPhone.length() == 12 && cleanPhone.startsWith("91")) {
            return cleanPhone.substring(2).matches("^[6-9]\\d{9}$");
        }
        
        return false;
    }

    /**
     * Validate password strength
     */
    public static boolean isValidPassword(String password) {
        return password != null && password.length() >= 6;
    }

    /**
     * Validate name
     */
    public static boolean isValidName(String name) {
        return name != null 
            && !name.trim().isEmpty() 
            && name.trim().length() >= 2
            && name.matches("^[a-zA-Z\\s]+$");
    }

    /**
     * Validate vehicle number (Indian format)
     */
    public static boolean isValidVehicleNumber(String vehicleNumber) {
        if (vehicleNumber == null || vehicleNumber.trim().isEmpty()) {
            return false;
        }
        
        // Remove spaces
        String cleanNumber = vehicleNumber.replaceAll("\\s", "").toUpperCase();
        
        // Indian vehicle number format: XX00XX0000 or XX00X0000
        return cleanNumber.matches("^[A-Z]{2}\\d{2}[A-Z]{1,2}\\d{4}$");
    }

    /**
     * Format phone number to +91 format
     */
    public static String formatPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return phone;
        }
        
        String cleanPhone = phone.replaceAll("[\\s()-+]", "");
        
        if (cleanPhone.length() == 10) {
            return "+91" + cleanPhone;
        } else if (cleanPhone.length() == 12 && cleanPhone.startsWith("91")) {
            return "+" + cleanPhone;
        } else if (cleanPhone.length() == 13 && cleanPhone.startsWith("+91")) {
            return cleanPhone;
        }
        
        return phone;
    }

    /**
     * Format vehicle number
     */
    public static String formatVehicleNumber(String vehicleNumber) {
        if (vehicleNumber == null || vehicleNumber.trim().isEmpty()) {
            return vehicleNumber;
        }
        
        return vehicleNumber.replaceAll("\\s", "").toUpperCase();
    }
}