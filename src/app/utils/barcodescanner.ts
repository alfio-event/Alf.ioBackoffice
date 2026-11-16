import {BarcodeScanner, ScanOptions, ScanResult} from "@nstudio/nativescript-barcodescanner";
import { Application } from "@nativescript/core";
import { keepPreviewOrientationInSync } from "./scannerOrientation";

export function defaultScanOptions(): ScanOptions {
    return <ScanOptions> {
        formats: "QR_CODE",   // Pass in of you want to restrict scanning to certain types
        cancelLabel: "Close", // iOS only, default 'Close'
        message: "Place the QR Code inside the rectangle to scan it", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        showFlipCameraButton: false,   // default false
        preferFrontCamera: false,     // default false
        showTorchButton: true,        // iOS only, default false
        orientation: "portrait",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
        openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied,
        resultDisplayDuration: 0,
        beepOnScan: Application.android != null
    }
}

/**
 * Opens the scanner, keeping the camera preview aligned with the UI while it is open.
 * See scannerOrientation.ios.ts for the details.
 */
export function scanWithOrientationFix(scanner: BarcodeScanner, options: ScanOptions): Promise<ScanResult> {
    // scan() must run first: it creates the native scanner that the orientation sync looks up
    const result = scanner.scan(options);
    const stop = keepPreviewOrientationInSync(scanner);
    return result.then(
        res => { stop(); return res; },
        err => { stop(); throw err; }
    );
}
