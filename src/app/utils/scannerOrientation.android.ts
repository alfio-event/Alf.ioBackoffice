import {BarcodeScanner} from "@nstudio/nativescript-barcodescanner";

export function keepPreviewOrientationInSync(scanner: BarcodeScanner): () => void {
    // not needed on Android: the scanner handles the orientation on its own
    return () => {};
}
