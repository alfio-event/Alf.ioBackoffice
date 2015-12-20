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

import alfio.backoffice.model.Event
import com.google.gson.reflect.TypeToken
import com.squareup.okhttp.OkHttpClient
import com.squareup.okhttp.Request
import com.squareup.okhttp.Response

class EventService: RemoteService {
    val client = OkHttpClient();

    fun loadUserEvents(baseUrl: String, username: String, password: String) : Response {
        val request = Request.Builder()
                .addHeader("Authorization", "Basic " + getAuthorizationHeader(username, password))
                .get()
                .url("$baseUrl/admin/api/events")
                .build();
        return client.newCall(request).execute();
    }

    fun loadSingleEvent(baseUrl: String, eventName: String) : Response {
        val request = Request.Builder()
                .get()
                .url("$baseUrl/api/events/$eventName")
                .build();
        return client.newCall(request).execute();
    }

    fun loadEventImage(url: String) : Response {
        return client.newCall(Request.Builder().get().url(url).build()).execute();
    }

    class ListOfEvents : TypeToken<List<Event>>();
}