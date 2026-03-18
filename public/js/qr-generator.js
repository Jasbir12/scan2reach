// ============================================================================
// QR GENERATION SYSTEM - Production Grade
// ============================================================================
// File: public/js/qr-generator.js

import QRCodeStyling from 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.esm.js';
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';

class Scan2ReachQRGenerator {
    constructor(profileId, profileType, profileData) {
        this.profileId = profileId;
        this.profileType = profileType;
        this.profileData = profileData;
        this.qrCode = null;
    }

    /**
     * Generate branded QR code with Scan2Reach styling
     */
    generateQR(containerId, options = {}) {
        const baseUrl = 'https://scan2reach.com';
        
        // Generate profile URL based on type
        const profileUrl = `${baseUrl}/profile/${this.profileId}`;

        // Default styling - branded Scan2Reach look
        const defaultOptions = {
            width: 500,
            height: 500,
            type: 'canvas',
            data: profileUrl,
            image: 'https://your-logo-url.com/logo.png', // Your logo
            margin: 10,
            qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'H' // High error correction (30%)
            },
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.3,
                margin: 5,
                crossOrigin: 'anonymous'
            },
            dotsOptions: {
                color: '#2563eb', // Scan2Reach blue
                type: 'rounded'
            },
            backgroundOptions: {
                color: '#ffffff'
            },
            cornersSquareOptions: {
                color: '#1d4ed8',
                type: 'extra-rounded'
            },
            cornersDotOptions: {
                color: '#1d4ed8',
                type: 'dot'
            }
        };

        // Merge with custom options
        const finalOptions = { ...defaultOptions, ...options };

        // Create QR code
        this.qrCode = new QRCodeStyling(finalOptions);

        // Append to container
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = ''; // Clear previous
            this.qrCode.append(container);
        }

        return this.qrCode;
    }

    /**
     * Download QR as PNG
     */
    async downloadPNG(filename) {
        if (!this.qrCode) {
            throw new Error('QR code not generated yet');
        }

        const name = filename || `scan2reach-${this.profileType}-${this.profileId}.png`;
        
        await this.qrCode.download({
            name: name,
            extension: 'png'
        });
    }

    /**
     * Download QR as SVG (scalable for printing)
     */
    async downloadSVG(filename) {
        if (!this.qrCode) {
            throw new Error('QR code not generated yet');
        }

        const name = filename || `scan2reach-${this.profileType}-${this.profileId}.svg`;
        
        await this.qrCode.download({
            name: name,
            extension: 'svg'
        });
    }

    /**
     * Generate print-ready PDF card
     * Different layouts for each product type
     */
    async downloadPDF() {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Get QR as data URL
        const qrDataUrl = await this.qrCode.getRawData('png');
        const qrBase64 = await this.blobToBase64(qrDataUrl);

        if (this.profileType === 'digital_card') {
            this.generateDigitalCardPDF(doc, qrBase64);
        } else if (this.profileType === 'vehicle') {
            this.generateVehicleStickerPDF(doc, qrBase64);
        } else if (this.profileType === 'business') {
            this.generateBusinessCardPDF(doc, qrBase64);
        }

        // Save PDF
        doc.save(`scan2reach-${this.profileType}-${this.profileId}.pdf`);
    }

    /**
     * Digital Card PDF Layout (Business Card Size)
     */
    generateDigitalCardPDF(doc, qrBase64) {
        const cardWidth = 85; // mm (standard business card)
        const cardHeight = 55; // mm

        // Background
        doc.setFillColor(37, 99, 235); // Scan2Reach blue
        doc.rect(10, 10, cardWidth, cardHeight, 'F');

        // White section
        doc.setFillColor(255, 255, 255);
        doc.rect(15, 15, cardWidth - 10, cardHeight - 10, 'F');

        // Name
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(this.profileData.fullName, 20, 25);

        // Designation & Company
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(this.profileData.designation, 20, 32);
        doc.text(this.profileData.companyName, 20, 38);

        // QR Code (smaller, corner placement)
        doc.addImage(qrBase64, 'PNG', 60, 20, 30, 30);

        // Scan instruction
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text('Scan to connect', 62, 54);

        // Scan2Reach branding
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text('Powered by Scan2Reach', 20, 60);

        // BACK SIDE (second card)
        doc.addPage();
        
        // Background
        doc.setFillColor(249, 250, 251);
        doc.rect(10, 10, cardWidth, cardHeight, 'F');

        // Large QR
        doc.addImage(qrBase64, 'PNG', 27.5, 12.5, 50, 50);

        // Instructions
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Scan to Save Contact', cardWidth / 2 + 10, 70, { align: 'center' });
    }

    /**
     * Vehicle Sticker PDF (Windshield Size)
     */
    generateVehicleStickerPDF(doc, qrBase64) {
        const width = 100; // mm
        const height = 70; // mm

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(5, 5, width, height, 'F');

        // Border
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(2);
        doc.rect(5, 5, width, height);

        // QR Code (centered, large)
        doc.addImage(qrBase64, 'PNG', 30, 15, 50, 50);

        // Vehicle number (if available)
        if (this.profileData.vehicleNumber) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text(this.profileData.vehicleNumber, width / 2 + 5, 70, { align: 'center' });
        }

        // Instructions
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Scan to Contact Owner', width / 2 + 5, 85, { align: 'center' });

        // Emergency contact badge
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(35, 95, 40, 10, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('EMERGENCY CONTACT', width / 2 + 5, 101, { align: 'center' });

        // Scan2Reach logo/text
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('scan2reach.com', width / 2 + 5, 115, { align: 'center' });
    }

    /**
     * Business Card PDF (Shop Window Size)
     */
    generateBusinessCardPDF(doc, qrBase64) {
        const width = 120; // mm (A6-ish)
        const height = 120; // mm (square)

        // Background gradient effect (simulated with rectangles)
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, width + 20, height + 20, 'F');
        
        doc.setFillColor(255, 255, 255);
        doc.rect(10, 10, width, height, 'F');

        // Business Name
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(this.profileData.businessName, width / 2 + 10, 25, { align: 'center' });

        // Description
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const splitDescription = doc.splitTextToSize(this.profileData.description, 100);
        doc.text(splitDescription, width / 2 + 10, 35, { align: 'center' });

        // QR Code (large, centered)
        doc.addImage(qrBase64, 'PNG', 35, 55, 60, 60);

        // Call to action
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Scan for Details', width / 2 + 10, 125, { align: 'center' });

        // Contact info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(this.profileData.contactNumber, width / 2 + 10, 135, { align: 'center' });

        // Scan2Reach watermark
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Created with Scan2Reach', width / 2 + 10, 145, { align: 'center' });
    }

    /**
     * Helper: Convert Blob to Base64
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Get QR as base64 for storage/display
     */
    async getQRBase64() {
        if (!this.qrCode) {
            throw new Error('QR code not generated yet');
        }

        const blob = await this.qrCode.getRawData('png');
        return this.blobToBase64(blob);
    }

    /**
     * Save QR to Firebase Storage
     */
    async saveToStorage(storage, profileId) {
        const qrBase64 = await this.getQRBase64();
        
        // Convert base64 to blob
        const response = await fetch(qrBase64);
        const blob = await response.blob();

        // Upload to Firebase Storage
        const storageRef = ref(storage, `qr_codes/${profileId}/qr.png`);
        await uploadBytes(storageRef, blob);

        // Get public URL
        const downloadURL = await getDownloadURL(storageRef);
        
        return downloadURL;
    }
}

// ============================================================================
// EXPORT
// ============================================================================

export default Scan2ReachQRGenerator;

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import Scan2ReachQRGenerator from './qr-generator.js';

// Initialize
const qrGen = new Scan2ReachQRGenerator(
    'ABC123',           // profileId
    'digital_card',     // type
    {                   // profile data
        fullName: 'John Doe',
        designation: 'CEO',
        companyName: 'Tech Corp',
        vehicleNumber: 'MH 02 AB 1234',
        businessName: 'My Shop'
    }
);

// Generate QR
qrGen.generateQR('qr-container');

// Download PNG
await qrGen.downloadPNG();

// Download PDF card
await qrGen.downloadPDF();

// Save to Firebase
const url = await qrGen.saveToStorage(storage, profileId);
*/
