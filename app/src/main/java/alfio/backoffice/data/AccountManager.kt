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
package alfio.backoffice.data

import alfio.backoffice.model.AlfioConfiguration
import com.google.gson.reflect.TypeToken
import java.util.*
import java.util.concurrent.ConcurrentHashMap

object AccountManager {

    private val blacklist: MutableSet<AlfioConfiguration> = hashSetOf()
    val configurations: MutableMap<String, AlfioConfiguration> = SharedPreferencesHolder.sharedPreferences.loadSavedValue(KEY_ALFIO_CONFIGURATIONS, SerializedConfigurations(), {if(it != null) ConcurrentHashMap(it) else ConcurrentHashMap() })
    val accounts: MutableList<AlfioConfiguration>
        get() = ArrayList(configurations.entries.sortedBy { it.key }.map { it.value })

    fun persistAlfioConfigurations() {
        SharedPreferencesHolder.sharedPreferences.persist(configurations, KEY_ALFIO_CONFIGURATIONS)
    }

    fun saveAlfioConfiguration(alfioConfiguration: AlfioConfiguration) : Int {
        val key = alfioConfiguration.key
        configurations.put(key, alfioConfiguration)
        persistAlfioConfigurations()
        return configurations.keys.sorted().indexOf(key)
    }


    fun removeAlfioConfiguration(alfioConfiguration: AlfioConfiguration) {
        configurations.remove(alfioConfiguration.key)
        blacklist.remove(alfioConfiguration)
        persistAlfioConfigurations()
    }

    fun blacklistConfiguration(configuration: AlfioConfiguration) {
        blacklist.add(configuration)
    }

    fun whitelistConfiguration(configuration: AlfioConfiguration) {
        blacklist.remove(configuration)
    }

    fun blacklistedConfigurationsCount() = blacklist.size

    fun isBlacklisted(configuration: AlfioConfiguration) = blacklist.contains(configuration)

}

private val KEY_ALFIO_CONFIGURATIONS = "alfio-configurations"
class SerializedConfigurations: TypeToken<MutableMap<String, AlfioConfiguration>>()