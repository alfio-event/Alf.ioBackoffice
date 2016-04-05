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

import alfio.backoffice.data.ConnectivityManager
import alfio.backoffice.service.SponsorScanBackgroundUploader
import android.app.Application
import android.content.Context
import android.content.IntentFilter

class AlfioBackoffice : Application() {

    var connectivityManager = ConnectivityManager();

    override fun onCreate() {
        Companion.ctx = applicationContext;
        connectivityManager.checkConnectivity(applicationContext);
        registerReceiver(ConnectivityManager(), IntentFilter("android.net.conn.CONNECTIVITY_CHANGE"));
        startBackgroundServices();
    }

    override fun onTerminate() {
        unregisterReceiver(connectivityManager);
    }

    private fun startBackgroundServices() {
        SponsorScanBackgroundUploader.start();
    }

    companion object {
        private var ctx: Context? = null;
        val context: Context
            get() {
                val c = ctx;
                if(c != null) {
                    return c;
                }
                throw AssertionError("Can't return a null value");
            }
    }
}