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

object PreferencesManager {
    val vibrationFeedbackEnabled: Boolean
        get() = SharedPreferencesHolder.sharedPreferences.getBoolean(KEY_VIBRATION_FEEDBACK_ENABLED, true)
    val shakeToCheckInEnabled: Boolean
        get() = SharedPreferencesHolder.sharedPreferences.getBoolean(KEY_SHAKE_TO_CHECK_IN_ENABLED, true)
}

private val KEY_VIBRATION_FEEDBACK_ENABLED = "enable_vibration_feedback"
private val KEY_SHAKE_TO_CHECK_IN_ENABLED = "enable_shake_to_checkin"