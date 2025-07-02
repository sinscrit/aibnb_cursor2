/**
 * QR Code Routes
 * Defines all API routes for QR code management and scanning
 */

const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');

// Health check - should be first to avoid conflicts
router.get('/health', qrCodeController.healthCheck);

// Analytics endpoint - should be before :qrId routes to avoid conflicts
router.get('/analytics', qrCodeController.getQRCodeAnalytics);

// QR Code CRUD routes
router.post('/', qrCodeController.createQRCode);
router.get('/', qrCodeController.getQRCodes);

// Public scanning endpoints (no auth required)
router.get('/:qrId', qrCodeController.getQRCodeByQRId);
router.post('/:qrId/scan', qrCodeController.recordScan);

// Management endpoints (for database IDs, not QR IDs)
router.put('/:id', qrCodeController.updateQRCode);
router.delete('/:id', qrCodeController.deleteQRCode);

module.exports = router;