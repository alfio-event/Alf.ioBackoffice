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

import alfio.backoffice.Common
import alfio.backoffice.model.AlfioConfiguration
import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import com.google.gson.reflect.TypeToken
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class DataService(context: Context) {

    private val sharedPreferences: SharedPreferences;
    val configurations: ConcurrentHashMap<String, AlfioConfiguration>;
    val alfioConfigurations: MutableList<AlfioConfiguration>
        get() = ArrayList(configurations.values);

    init {
        this.sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        val existing: Map<String, AlfioConfiguration>? = Common.gson.fromJson(sharedPreferences.getString(KEY_ALFIO_CONFIGURATIONS, ""), SerializedConfigurations().type);
        this.configurations = if(existing != null) ConcurrentHashMap(existing) else ConcurrentHashMap();
    }

    fun persistAlfioConfigurations() {
        sharedPreferences.edit().putString(KEY_ALFIO_CONFIGURATIONS, Common.gson.toJson(configurations)).apply();
    }

    fun saveAlfioConfiguration(alfioConfiguration: AlfioConfiguration) {
        configurations.put("${alfioConfiguration.eventName}@${alfioConfiguration.url}", alfioConfiguration);
        persistAlfioConfigurations();
    }

    companion object {
        private val KEY_ALFIO = "alfio"
        private val KEY_ALFIO_CONFIGURATIONS = "alfio-configurations"
        private val EVENT_ID = "eventId"
    }

}
class ListOfAlfioConfigurations: TypeToken<List<AlfioConfiguration>>();
class SerializedConfigurations: TypeToken<Map<String, AlfioConfiguration>>();
