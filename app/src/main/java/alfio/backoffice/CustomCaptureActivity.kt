/**
 * This file is part of alf.io backoffice.

 * alf.io backoffice is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * alf.io backoffice is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with alf.io backoffice.  If not, see //www.gnu.org/licenses/>.
 */
package alfio.backoffice

import android.app.Activity
import android.graphics.Bitmap
import android.os.Bundle
import android.os.Handler
import android.os.Vibrator
import android.view.KeyEvent
import android.widget.Toast
import com.google.zxing.Result
import com.google.zxing.ResultPoint
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.CaptureManager
import com.journeyapps.barcodescanner.DecoratedBarcodeView

class CustomCaptureActivity : Activity() {

    private var captureManager: CaptureManager? = null
    private var barcodeScannerView: DecoratedBarcodeView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val barcodeScannerView = this.initializeContent()
        this.barcodeScannerView = barcodeScannerView
        this.captureManager = if(this.intent.hasExtra("CONTINUOUS")) {
            ContinuousCustomCaptureManager(this.intent.hasExtra("CONTINUOUS"), this, barcodeScannerView)
        } else {
            CaptureManager(this, barcodeScannerView)
        }
        this.captureManager!!.initializeFromIntent(this.intent, savedInstanceState)
        this.captureManager!!.decode()
    }


    private fun initializeContent(): DecoratedBarcodeView {
        this.setContentView(R.layout.zxing_capture)
        return this.findViewById(R.id.zxing_barcode_scanner) as DecoratedBarcodeView
    }

    override fun onResume() {
        super.onResume()
        this.captureManager?.onResume()
    }

    override fun onPause() {
        super.onPause()
        this.captureManager?.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        this.captureManager?.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        this.captureManager?.onSaveInstanceState(outState)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        this.captureManager?.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        return this.barcodeScannerView?.onKeyDown(keyCode, event)?:false || super.onKeyDown(keyCode, event)
    }
}

class ContinuousCustomCaptureManager(val continuous: Boolean, val context: CustomCaptureActivity, val decoratedBarcodeView: DecoratedBarcodeView): CaptureManager(context, decoratedBarcodeView) {

    val handler = Handler()
    val vibrator: Vibrator = context.getSystemService("vibrator") as Vibrator

    override fun decode() {
        decoratedBarcodeView.decodeContinuous(object: BarcodeCallback {

            val results = arrayOfNulls<String>(3)
            val multipleCodePattern = Regex("^(\\d+):(\\d+):(.+$)")

            override fun barcodeResult(result: BarcodeResult?) {
                if(result != null) {
                    val text = result.text
                    val match = multipleCodePattern.matchEntire(text)
                    val index = match?.groupValues?.get(1)?.toInt()?.minus(1)
                    val successfulPartialScan = if(index != null) results[index] == null else false;
                    if(index != null && results[index] == null) {
                        results[index] = match.groupValues[3]
                    }
                    if(!continuous || match == null || results.all { it != null }) {
                        vibrator.vibrate(100L)
                        val code = if(continuous && match != null) {
                            results.joinToString("")
                        } else {
                            text
                        }
                        decoratedBarcodeView.pause()
                        handler.post({ returnResult(CustomBarcodeResult(code, result)) })
                    } else if(successfulPartialScan) {
                        vibrator.vibrate(50L)
                        Toast.makeText(context, alfio.backoffice.R.string.scan_next_code, Toast.LENGTH_SHORT).show()
                    }
                }

            }

            override fun possibleResultPoints(p0: MutableList<ResultPoint>?) {
            }

        })
    }
}

class CustomBarcodeResult(text: String, val src: BarcodeResult): BarcodeResult(Result(text, src.rawBytes, src.resultPoints, src.barcodeFormat), null) {
    override fun getBitmap(): Bitmap = src.bitmap
}