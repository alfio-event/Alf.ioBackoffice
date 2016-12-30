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

import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.ConnectionConfiguration
import alfio.backoffice.model.Event
import com.google.gson.reflect.TypeToken
import okhttp3.Response

class EventService: RemoteService {
    fun loadUserEvents(config: ConnectionConfiguration) : Response = callProtectedRequest(config, "/admin/api/events").invoke(httpClient)

    fun loadSingleEvent(config: AlfioConfiguration) : Response = callUnprotectedRequest(config, "/api/events/${config.eventName}").invoke(httpClient)

    fun loadEventImage(config: AlfioConfiguration) : Response = callUnprotectedRequest(config, config.event.imageUrl!!).invoke(httpClient)

    class ListOfEvents : TypeToken<List<Event>>()
}