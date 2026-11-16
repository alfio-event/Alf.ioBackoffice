import {BarcodeScanner} from "@nstudio/nativescript-barcodescanner";

/**
 * Keeps the scanner's camera preview aligned with the UI orientation.
 * Returns a function that stops the synchronization.
 */
export declare function keepPreviewOrientationInSync(scanner: BarcodeScanner): () => void;
