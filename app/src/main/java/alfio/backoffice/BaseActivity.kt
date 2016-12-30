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

import alfio.backoffice.data.AccountManager
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.ConnectionConfiguration
import alfio.backoffice.model.Event
import alfio.backoffice.task.EventListLoader
import alfio.backoffice.task.EventListLoaderCommand
import alfio.backoffice.task.EventListLoaderResult
import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.app.AlertDialog
import android.content.pm.PackageManager
import android.os.Build
import android.support.design.widget.Snackbar
import android.support.v7.app.AppCompatActivity
import android.util.Log
import android.widget.TextView
import com.google.zxing.integration.android.IntentIntegrator
import kotlinx.android.synthetic.main.content_settings.*
import java.text.DateFormat
import java.text.DateFormat.MEDIUM
import java.text.DateFormat.SHORT

abstract class BaseActivity: AppCompatActivity() {

    private val pendingActions: MutableMap<Int, Pair<Boolean, () -> Unit>> = hashMapOf()
    private var requestId: Int = 0

    fun BaseActivity.scanQRCode(resId: Int) : () -> Unit = {
        val integrator: IntentIntegrator = IntentIntegrator(this)
        integrator.captureActivity = CustomCaptureActivity::class.java
        integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE_TYPES)
        integrator.setOrientationLocked(false)
        integrator.setBeepEnabled(true)
        integrator.setPrompt(getString(resId))
        integrator.initiateScan()
    }

    @SuppressLint("NewApi")
    fun BaseActivity.requestPermissionForAction(permissions: List<String>, action: () -> Unit, required: Boolean = true) : Unit {
        val missingPermissions: List<String> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            permissions.filter {checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED}
        } else listOf<String>()
        if(missingPermissions.isNotEmpty()) {
            val id = ++requestId
            requestPermissions(missingPermissions.toTypedArray(), id)
            pendingActions.put(id, required to action)
        } else {
            action()
        }
    }

    @TargetApi(Build.VERSION_CODES.M)
    @SuppressLint("NewApi")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        val action = pendingActions[requestCode] ?: Pair(false, {super.onRequestPermissionsResult(requestCode, permissions, grantResults)})
        if(grantResults.any { it != PackageManager.PERMISSION_GRANTED } && action.first) {
            Log.d(this.javaClass.canonicalName, "The user didn't grant all the permissions")
            Snackbar.make(content, R.string.message_accept_permissions, Snackbar.LENGTH_LONG).show()
            return
        }
        action.second()
    }

    fun loadAndSelectEvent(connectionConfiguration: ConnectionConfiguration, onSuccess: (AlfioConfiguration, Int) -> Unit) {

        val resultHandler: (EventListLoaderResult, Int) -> Unit = {
            resp, which ->
            val event = resp.results[which]
            val src = resp.param!!.config
            val configuration = AlfioConfiguration(src.url, src.username, src.password, src.sslCert, resp.userType, event)
            val index = AccountManager.saveAlfioConfiguration(configuration)
            onSuccess.invoke(configuration, index)
        }
        EventListLoader(this)
                .then({
                    when(it.results.size) {
                        1 -> resultHandler(it, 0)
                        else -> AlertDialog.Builder(this)
                                .setTitle(R.string.dialog_select_event_title)
                                .setItems(it.results.map { it.name }.toTypedArray(), {
                                    dialog, which ->
                                    resultHandler(it, which)
                                })
                                .show()
                    }
                })
                .execute(EventListLoaderCommand(connectionConfiguration))
    }

    companion object {
        fun writeEventDetails(event: Event, config: AlfioConfiguration, eventDates: TextView, eventDescription: TextView, userDetail: TextView, url: TextView, eventName: TextView) {
            val dates: String
            if(event.oneDay) {
                dates = "${DateFormat.getDateTimeInstance(MEDIUM, SHORT).format(event.begin)} - ${DateFormat.getTimeInstance(SHORT).format(event.end)}"
            } else {
                dates = "${DateFormat.getDateTimeInstance(SHORT, SHORT).format(event.begin)} - ${DateFormat.getDateTimeInstance(SHORT, SHORT).format(event.end)}"
            }
            eventDates.text = dates
            eventDescription.text = event.location
            userDetail.text = "${config.userType}"
            url.text = config.url.replace("^https?://(.*?)(:\\d+)?$".toRegex(), {
                if(it.groups[1] != null) {
                    it.groups[1]!!.value
                } else {
                    it.value
                }
            })
            eventName.text = config.event.name
        }
    }

}