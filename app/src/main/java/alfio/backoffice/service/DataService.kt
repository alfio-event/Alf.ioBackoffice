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

object DataService {

    private val sharedPreferences: SharedPreferences;
    private val blacklist: MutableSet<AlfioConfiguration> = hashSetOf();
    val configurations: ConcurrentHashMap<String, AlfioConfiguration>;
    val alfioConfigurations: MutableList<AlfioConfiguration>
        get() = ArrayList(configurations.values.filter { !blacklist.contains(it) });
    val vibrationFeedbackEnabled: Boolean
        get() = sharedPreferences.getBoolean(KEY_VIBRATION_FEEDBACK_ENABLED, true);
    val shakeToCheckInEnabled: Boolean
        get() = sharedPreferences.getBoolean(KEY_SHAKE_TO_CHECK_IN_ENABLED, true);

    init {
        this.sharedPreferences = PreferenceManager.getDefaultSharedPreferences(AlfioBackoffice.context);
        val existing: Map<String, AlfioConfiguration>? = Common.gson.fromJson(sharedPreferences.getString(KEY_ALFIO_CONFIGURATIONS, ""), SerializedConfigurations().type);
        this.configurations = if(existing != null) ConcurrentHashMap(existing) else ConcurrentHashMap();
    }

    fun persistAlfioConfigurations() {
        sharedPreferences.edit().putString(KEY_ALFIO_CONFIGURATIONS, Common.gson.toJson(configurations)).apply();
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

}
private val KEY_ALFIO_CONFIGURATIONS = "alfio-configurations"
private val KEY_VIBRATION_FEEDBACK_ENABLED = "enable_vibration_feedback"
private val KEY_SHAKE_TO_CHECK_IN_ENABLED = "enable_shake_to_checkin"
class SerializedConfigurations: TypeToken<Map<String, AlfioConfiguration>>();
