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
import android.content.Context
import java.io.Serializable

class EventDetailLoader(c: Context) : AlfioAsyncTask<Event, EventDetailParam, EventDetailResult>(c) {

    override fun emptyResult(): EventDetailResult {
        return EventDetailResult(false, null, ByteArray(0));
    }

    override fun work(param: EventDetailParam): Pair<EventDetailParam, EventDetailResult> {
        val response = eventService.loadSingleEvent(param.baseUrl, param.eventName);
        if(response.isSuccessful) {
            val event = Common.gson.fromJson(response.body().string(), Event::class.java);
            val image = if(event.imageUrl != null) {
                loadEventImage(param.baseUrl, event);
            } else ByteArray(0);
            return param to EventDetailResult(true, event, image);
        }
        return param to emptyResult();
    }

    private fun loadEventImage(baseUrl: String, event: Event) : ByteArray {
        if(event.imageUrl == null) {
            return ByteArray(0);
        }
        val url = if(event.imageUrl!!.startsWith("http")) event.imageUrl else "$baseUrl${event.imageUrl}";
        val response = eventService.loadEventImage(url!!);
        if(response.isSuccessful) {
            return response.body().bytes();
        }
        return ByteArray(0);
    }

    override fun post(result: EventDetailResult?) {
        if(result != null) {
            successCallbacks.forEach { it(result); }
        }
    }
}

data class EventDetailParam(val baseUrl: String, val eventName: String) : TaskParam;
data class EventDetailResult(val success: Boolean, val event: Event?, val image: ByteArray) : TaskResult<Event>, Serializable {
    override fun isSuccessful(): Boolean {
        return success;
    }

    override fun getResponse(): Event? {
        return event;
    }
};