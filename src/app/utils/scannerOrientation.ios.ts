import {BarcodeScanner} from "@nstudio/nativescript-barcodescanner";

/*
 * The iOS scanner (QRCodeReaderViewController) reads UIApplication.statusBarOrientation
 * to orient the camera preview. Since the app adopted the scene lifecycle
 * (UIApplicationSceneManifest), that value no longer reflects the real orientation,
 * so the preview falls back to portrait and appears rotated by 90° in landscape.
 * Here we set the orientation ourselves from the window scene, once the scanner is
 * on screen and after every rotation. This relies on the plugin's private `_scanner` field.
 */
export function keepPreviewOrientationInSync(scanner: BarcodeScanner): () => void {
    const apply = () => {
        try {
            const connection = (scanner as any)._scanner?.codeReader?.previewLayer?.connection as AVCaptureConnection;
            const orientation = currentInterfaceOrientation();
            // UIInterfaceOrientation and AVCaptureVideoOrientation share the same raw values (1..4)
            if (connection && connection.supportsVideoOrientation && orientation >= 1 && orientation <= 4) {
                if (connection.videoOrientation !== <number>orientation) {
                    connection.videoOrientation = <number>orientation;
                }
            }
        } catch (e) {
            console.log("cannot fix scanner orientation", e);
        }
    };

    // the plugin presents the scanner asynchronously (with a delay of up to 650ms),
    // then sets the wrong orientation in viewWillAppear: wait until it is on screen.
    let attempts = 0;
    const presentationTimer = setInterval(() => {
        attempts++;
        const vc = (scanner as any)._scanner as UIViewController;
        if (vc?.viewIfLoaded?.window != null) {
            apply();
            clearInterval(presentationTimer);
        } else if (attempts > 50) {
            clearInterval(presentationTimer);
        }
    }, 100);

    // the plugin resets the orientation on every device rotation, so re-apply after it
    const observer = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
        UIDeviceOrientationDidChangeNotification, null, NSOperationQueue.mainQueue,
        () => setTimeout(apply, 0)
    );

    return () => {
        clearInterval(presentationTimer);
        NSNotificationCenter.defaultCenter.removeObserver(observer);
    };
}

function currentInterfaceOrientation(): UIInterfaceOrientation {
    const scenes = UIApplication.sharedApplication.connectedScenes;
    const enumerator = scenes.objectEnumerator();
    let scene = enumerator.nextObject();
    while (scene != null) {
        if (scene instanceof UIWindowScene) {
            return scene.interfaceOrientation;
        }
        scene = enumerator.nextObject();
    }
    return UIInterfaceOrientation.Unknown;
}
