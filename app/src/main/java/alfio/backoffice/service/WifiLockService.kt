package alfio.backoffice.service

import alfio.backoffice.BaseActivity
import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import java.util.concurrent.atomic.AtomicReference

class WifiLockService {

    companion object {
        private val wifiLock: AtomicReference<WifiManager.WifiLock?> = AtomicReference(null)
        fun requestLock(baseActivity: BaseActivity): Boolean {
            val lock = retrieveLock(baseActivity)
            return if(!lock.isHeld) {
                lock.acquire()
                Log.i("WifiLockService", "lock acquired!")
                true
            } else {
                Log.w("WifiLockService", "cannot acquire a lock. $lock")
                false
            }
        }

        fun releaseLock(): Boolean {
            val lock = wifiLock.get()
            return if(lock != null && lock.isHeld) {
                lock.release()
                true
            } else {
                Log.w("WifiLockService", "Lock has not been released because nobody is holding it.")
                false
            }
        }

        private fun retrieveLock(context: BaseActivity): WifiManager.WifiLock {
            val existingLock = wifiLock.get()
            if(existingLock == null) {
                context.requestPermissionForAction(listOf(android.Manifest.permission.WAKE_LOCK), {
                    val wiFiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
                    val lock = wiFiManager.createWifiLock(WifiManager.WIFI_MODE_SCAN_ONLY, "Alf.io-backoffice")
                    wifiLock.compareAndSet(null, lock)
                })
            }
            return wifiLock.get()!!
        }
    }


}