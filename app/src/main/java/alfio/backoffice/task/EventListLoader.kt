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
package alfio.backoffice.task

import alfio.backoffice.Common
import alfio.backoffice.model.Event
import alfio.backoffice.model.UserType
import alfio.backoffice.service.EventService
import android.content.Context

class EventListLoader(caller: Context): AlfioAsyncTask<List<Event>, EventListLoaderCommand, EventListLoaderResult>(caller) {

    override fun emptyResult(): EventListLoaderResult {
        return EventListLoaderResult(false, emptyList(), null);
    }

    override fun work(param: EventListLoaderCommand): Pair<EventListLoaderCommand, EventListLoaderResult> {
        val userRoleResponse = userService.loadUserType(param.baseUrl, param.username, param.password);
        if(!userRoleResponse.isSuccessful) {
            return param to emptyResult();
        }
        val userType = UserType.fromString(userRoleResponse.body().string());
        val response = eventService.loadUserEvents(param.baseUrl, param.username, param.password);
        if(response.isSuccessful) {
            val events: List<Event> = Common.gson.fromJson(response.body().string(), EventService.ListOfEvents().type);
            return param to EventListLoaderResult(true, events.filter { !it.external; }, param, userType);
        }
        return param to emptyResult();
    }

    override fun getProgressMessage(): String {
        return "loading events...";
    }
}

data class EventListLoaderCommand(val baseUrl: String, val username: String, val password: String) : TaskParam;
data class EventListLoaderResult(val success: Boolean, val results: List<Event>, val param: EventListLoaderCommand?, val userType: UserType = UserType.STAFF) : TaskResult<List<Event>> {
    override fun isSuccessful(): Boolean = success;
    override fun getResponse(): List<Event> = results;
};
