import { onCall, HttpsError } from "firebase-functions/v2/https";
import { IdentityInsights } from '@vonage/identity-insights';

function formatPrivateKey(key) {
    if (!key) return '';
    let normalized = key.replace(/\\n/g, '\n').trim();
    if (normalized.includes('\n')) {
        return normalized;
    }
    const match = normalized.match(/^(-----BEGIN [A-Z ]+-----)(.*?)(-----END [A-Z ]+-----)$/);
    if (match) {
        const header = match[1];
        const body = match[2].replace(/\s+/g, '');
        const footer = match[3];
        const chunks = body.match(/.{1,64}/g) || [];
        return `${header}\n${chunks.join('\n')}\n${footer}`;
    }
    return normalized;
}

export const validatePhone = onCall({
    secrets: ["VONAGE_APPLICATION_ID", "VONAGE_PRIVATE_KEY"]
}, async (request) => {
    const rawPhone = request.data.phone || '';

    // Basic validation to ensure a payload was received
    if (!rawPhone) {
        throw new HttpsError('invalid-argument', 'Phone number is required.');
    }

    // Sanitise: keep digits only (strip spaces, dashes, parentheses, leading +)
    const phoneNumber = rawPhone.replace(/[^\d]/g, '');

    // Initialize Vonage client inside the handler so the secrets are populated in process.env
    const rawKey = process.env.VONAGE_PRIVATE_KEY || '';
    const formattedKey = formatPrivateKey(rawKey);

    const identityClient = new IdentityInsights({
        applicationId: process.env.VONAGE_APPLICATION_ID,
        privateKey: formattedKey
    });

    try {
        const response = await identityClient.getIdentityInsights({
            phone_number: phoneNumber,
            purpose: 'FraudPreventionAndDetection',
            insights: {
                format: {},
                original_carrier: {},
                current_carrier: {}
            }
        });

        const insights = response.insights || {};
        const formatData = insights.format || {};
        const currentCarrier = insights.currentCarrier || {};
        const originalCarrier = insights.originalCarrier || {};

        // We only return safe, non-sensitive data back to the client
        return {
            valid: formatData.isFormatValid === true,
            country: formatData.countryCode || 'Unknown',
            formattedNumber: formatData.numberInternational || phoneNumber,
            currentCarrierName: currentCarrier.name || 'Unknown',
            originalCarrierName: originalCarrier.name || 'Unknown',
            networkType: currentCarrier.networkType || originalCarrier.networkType || 'Unknown'
        };
    } catch (error) {
        console.error('Validation error:', error);
        throw new HttpsError('internal', 'Failed to validate phone number.');
    }
});