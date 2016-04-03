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

import alfio.backoffice.AlfioBackoffice
import alfio.backoffice.Common
import android.content.SharedPreferences
import android.preference.PreferenceManager
import com.google.gson.reflect.TypeToken

object SharedPreferencesHolder {
    val sharedPreferences: SharedPreferences;
    init {
        this.sharedPreferences = PreferenceManager.getDefaultSharedPreferences(AlfioBackoffice.context);
    }
}

fun SharedPreferences.persist(obj: Any, key: String) {
    this.edit().putString(key, Common.gson.toJson(obj)).apply();
}

fun SharedPreferences.synchronizedPersist(obj: Any, key: String) {
    synchronized(obj, {this.edit().putString(key, Common.gson.toJson(obj)).apply()});
}

fun <T> SharedPreferences.loadSavedValue(key: String, typeToken: TypeToken<T>, supplier: (T?) -> T) : T {
    val existing:T? = Common.gson.fromJson(this.getString(key, ""), typeToken.type);
    return supplier(existing);
}