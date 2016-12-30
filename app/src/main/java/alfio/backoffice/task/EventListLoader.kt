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
import alfio.backoffice.model.ConnectionConfiguration
import alfio.backoffice.model.Event
import alfio.backoffice.model.UserType
import alfio.backoffice.service.EventService
import android.content.Context

class EventListLoader(caller: Context): AlfioAsyncTask<List<Event>, EventListLoaderCommand, EventListLoaderResult>(caller) {

    override fun emptyResult() = EventListLoaderResult(false, emptyList(), null)
    override fun errorResult(error: Throwable) = EventListLoaderResult(false, emptyList(), null, error = error)

    override fun work(param: EventListLoaderCommand): Pair<EventListLoaderCommand, EventListLoaderResult> {
        val userRoleResponse = userService.loadUserType(param.config)
        if(!userRoleResponse.isSuccessful) {
            return param to emptyResult()
        }
        val userRoleResponseBody = userRoleResponse.body()
        val userType = UserType.fromString(Common.gson.fromJson(userRoleResponseBody.string(), String::class.java))
        val response = eventService.loadUserEvents(param.config)
        val responseBody = response.body()
        try {
            if(response.isSuccessful) {
                val events: List<Event> = Common.gson.fromJson(responseBody.string(), EventService.ListOfEvents().type)
                return param to EventListLoaderResult(true, events.filter { !it.external; }, param, userType)
            }
            return param to emptyResult()
        } finally {
            userRoleResponseBody.close()
            responseBody.close()
        }
    }

    override fun getProgressMessage(): String {
        return "loading events..."
    }
}

data class EventListLoaderCommand(val config: ConnectionConfiguration) : TaskParam
class EventListLoaderResult(val success: Boolean, val results: List<Event>, val param: EventListLoaderCommand?, val userType: UserType = UserType.STAFF, error: Throwable? = null) : TaskResult<List<Event>>(results, error) {
    override fun isSuccessful(): Boolean = success
}
