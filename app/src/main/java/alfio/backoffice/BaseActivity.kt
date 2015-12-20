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

import alfio.backoffice.service.DataService
import android.annotation.SuppressLint
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.os.Build
import android.support.design.widget.Snackbar
import android.support.v7.app.AppCompatActivity
import android.util.Log
import com.google.zxing.integration.android.IntentIntegrator

abstract class BaseActivity: AppCompatActivity() {

    private val pendingActions: MutableMap<Int, Pair<Boolean, () -> Unit>> = hashMapOf();
    private var requestId: Int = 0;

    public val dataService : DataService
        get() {
            return DataService(this)
        };

    override fun onPause() {
        super.onPause();
    }

    fun BaseActivity.scanQRCode(resId: Int) : () -> Unit = {
        val integrator: IntentIntegrator = IntentIntegrator(this);
        integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE_TYPES);
        integrator.setResultDisplayDuration(0);
        integrator.setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        integrator.setPrompt(getString(resId));
        integrator.initiateScan();
    }

    @SuppressLint("NewApi")
    fun BaseActivity.requestPermissionForAction(permissions: List<String>, action: () -> Unit, required: Boolean = true) : Unit {
        val missingPermissions: List<String> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            permissions.filter {checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED};
        } else listOf<String>();
        if(missingPermissions.size > 0) {
            val id = ++requestId;
            requestPermissions(missingPermissions.toTypedArray(), id);
            pendingActions.put(id, required to action);
        } else {
            action();
        }
    }

    //@TargetApi(Build.VERSION_CODES.M) //FIXME: why this annotation is not recognized during build?
    @SuppressLint("NewApi")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        val action = pendingActions.getOrElse(requestCode, {Pair(false, {super.onRequestPermissionsResult(requestCode, permissions, grantResults)})});
        if(grantResults.any { !it.equals(PackageManager.PERMISSION_GRANTED) } && action.first) {
            Log.d(this.javaClass.canonicalName, "The user didn't grant all the permissions");
            Snackbar.make(findViewById(android.R.id.content), R.string.message_accept_permissions, Snackbar.LENGTH_LONG).show();
            return;
        }
        action.second();
    }

}