// UPDATE FOR create-profile.html
// Replace the payment section with this secure version

// ============================================================================
// SECURE PAYMENT FLOW (Client-side code)
// ============================================================================

async function initiateSecurePayment(profileId, amount, type) {
    try {
        // Step 1: Create Razorpay order on SERVER (prevents amount tampering)
        const createOrder = httpsCallable(functions, 'createRazorpayOrder');
        const orderResult = await createOrder({
            amount: amount * 100, // Convert to paise
            profileId: profileId,
            profileType: type
        });

        const { orderId, amount: orderAmount, currency } = orderResult.data;

        // Step 2: Open Razorpay checkout with server-created order
        const options = {
            key: 'rzp_test_YOUR_KEY_ID', // Replace with your key ID
            amount: orderAmount,
            currency: currency,
            order_id: orderId, // Server-created order ID
            name: 'Scan2Reach',
            description: `${type.replace('_', ' ').toUpperCase()} - 1 Year Subscription`,
            image: 'https://your-logo-url.com/logo.png',
            
            prefill: {
                email: currentUser.email,
                contact: currentUser.phoneNumber || ''
            },

            handler: async function (response) {
                try {
                    showMessage('Verifying payment...', 'success');

                    // Step 3: Verify payment signature on SERVER
                    const verifyPayment = httpsCallable(functions, 'verifyAndActivateProfile');
                    const verifyResult = await verifyPayment({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        profileId: profileId
                    });

                    if (verifyResult.data.success) {
                        showMessage('Payment verified! Profile activated. Redirecting...', 'success');
                        
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 2000);
                    } else {
                        throw new Error('Payment verification failed');
                    }

                } catch (error) {
                    console.error('Payment verification error:', error);
                    showMessage(
                        'Payment received but verification failed. Please contact support with payment ID: ' + 
                        response.razorpay_payment_id, 
                        'error'
                    );
                }
            },

            modal: {
                ondismiss: function() {
                    showMessage('Payment cancelled. You can complete payment later from dashboard.', 'error');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                }
            },

            theme: {
                color: '#2563eb'
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.open();

    } catch (error) {
        console.error('Payment initiation error:', error);
        showMessage('Failed to initiate payment. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue to Payment';
    }
}

// ============================================================================
// REQUIRED IMPORTS (add to top of script)
// ============================================================================

import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

const functions = getFunctions(app);
