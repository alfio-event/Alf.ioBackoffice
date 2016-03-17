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
package alfio.backoffice.service

import alfio.backoffice.AlfioBackoffice
import alfio.backoffice.Common
import alfio.backoffice.model.AlfioConfiguration
import android.content.SharedPreferences
import android.preference.PreferenceManager
import com.google.gson.reflect.TypeToken
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue

object DataService {

    private val sharedPreferences: SharedPreferences;
    private val blacklist: MutableSet<AlfioConfiguration> = hashSetOf();
    private val pendingSponsorScanQueue: Queue<Pair<AlfioConfiguration, String>>;
    private val inProcessScan: MutableList<Pair<AlfioConfiguration, String>>;
    val configurations: MutableMap<String, AlfioConfiguration>;
    val alfioConfigurations: MutableList<AlfioConfiguration>
        get() = ArrayList(configurations.values.filter { !blacklist.contains(it) });
    val vibrationFeedbackEnabled: Boolean
        get() = sharedPreferences.getBoolean(KEY_VIBRATION_FEEDBACK_ENABLED, true);
    val shakeToCheckInEnabled: Boolean
        get() = sharedPreferences.getBoolean(KEY_SHAKE_TO_CHECK_IN_ENABLED, true);

    init {
        this.sharedPreferences = PreferenceManager.getDefaultSharedPreferences(AlfioBackoffice.context);
        this.configurations = loadSavedValue(KEY_ALFIO_CONFIGURATIONS, SerializedConfigurations(), {if(it != null) ConcurrentHashMap(it) else ConcurrentHashMap()})
        this.pendingSponsorScanQueue = loadSavedValue(KEY_PENDING_SPONSOR_SCAN, SerializedPendingSponsorScanQueue(), {if(it != null) ConcurrentLinkedQueue(it) else ConcurrentLinkedQueue()})
        this.inProcessScan = loadSavedValue(KEY_IN_PROCESS_SPONSOR_SCAN, SerializedInProcessScan(), {if(it != null) ArrayList(it) else mutableListOf()})
    }

    fun <T> loadSavedValue(key: String, typeToken: TypeToken<T>, supplier: (T?) -> T) : T {
        val existing:T? = Common.gson.fromJson(sharedPreferences.getString(key, ""), typeToken.type);
        return supplier(existing);
    }

    fun persistAlfioConfigurations() {
        persist(configurations, KEY_ALFIO_CONFIGURATIONS);
    }

    fun saveAlfioConfiguration(alfioConfiguration: AlfioConfiguration) {
        configurations.put(buildKey(alfioConfiguration), alfioConfiguration);
        persistAlfioConfigurations();
    }

    private fun buildKey(alfioConfiguration: AlfioConfiguration) = "${alfioConfiguration.username}@${alfioConfiguration.eventName}@${alfioConfiguration.url}"

    fun removeAlfioConfiguration(alfioConfiguration: AlfioConfiguration) {
        configurations.remove(buildKey(alfioConfiguration));
        persistAlfioConfigurations();
    }

    fun blacklistConfiguration(configuration: AlfioConfiguration) {
        blacklist.add(configuration);
    }

    fun whitelistConfiguration(configuration: AlfioConfiguration) {
        blacklist.remove(configuration);
    }

    fun blacklistedConfigurationsCount() = blacklist.size;

    fun getPendingSponsorScan(): Map<AlfioConfiguration, List<String>> {
        val extracted : MutableList<Pair<AlfioConfiguration, String>> = mutableListOf();
        while(pendingSponsorScanQueue.isNotEmpty()) {
            val e = pendingSponsorScanQueue.poll() ?: break;
            extracted.add(e);
        }
        inProcessScan.addAll(extracted);

        return extracted.groupBy({ it.first }, {it.second});
    };

    fun enqueueSponsorScan(configuration: AlfioConfiguration, code: String) {
        pendingSponsorScanQueue.offer(configuration to code);
        persist(pendingSponsorScanQueue, KEY_PENDING_SPONSOR_SCAN);
    }

    private fun persist(obj: Any, key: String) {
        sharedPreferences.edit().putString(key, Common.gson.toJson(obj)).apply();
    }
}

private val KEY_ALFIO_CONFIGURATIONS = "alfio-configurations"
private val KEY_PENDING_SPONSOR_SCAN = "alfio-pending-sponsor-scan"
private val KEY_IN_PROCESS_SPONSOR_SCAN = "alfio-in-process-sponsor-scan"
private val KEY_VIBRATION_FEEDBACK_ENABLED = "enable_vibration_feedback"
private val KEY_SHAKE_TO_CHECK_IN_ENABLED = "enable_shake_to_checkin"
class SerializedConfigurations: TypeToken<MutableMap<String, AlfioConfiguration>>();
class SerializedPendingSponsorScanQueue: TypeToken<Queue<Pair<AlfioConfiguration, String>>>();
class SerializedInProcessScan: TypeToken<MutableList<Pair<AlfioConfiguration, String>>>();
