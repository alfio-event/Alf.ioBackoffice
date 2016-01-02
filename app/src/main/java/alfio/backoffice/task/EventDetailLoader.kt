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
import android.util.Log
import java.io.Serializable
import java.nio.ByteBuffer

class EventDetailLoader(c: Context, showProgressDialog: Boolean = true) : AlfioAsyncTask<Event, EventDetailParam, EventDetailResult>(c, showProgressDialog) {

    override fun emptyResult(): EventDetailResult {
        return EventDetailResult(false, null, "", ByteArray(0));
    }

    override fun work(param: EventDetailParam): Pair<EventDetailParam, EventDetailResult> {
        val response = eventService.loadSingleEvent(param.baseUrl, param.eventName);
        if(response.isSuccessful) {
            val event = Common.gson.fromJson(response.body().string(), Event::class.java);
            val image = EventImageLoader(caller).work(EventImageParam(param.baseUrl, event)).second;
            return param to EventDetailResult(true, event, image.fileName, image.image);
        }
        return param to emptyResult();
    }

    override fun post(result: EventDetailResult?) {
        if(result != null) {
            successCallbacks.forEach { it(result); }
        }
    }
}

data class EventDetailParam(val baseUrl: String, val eventName: String) : TaskParam;
data class EventDetailResult(val success: Boolean, val event: Event?, val fileName: String, val image: ByteArray) : TaskResult<Event>, Serializable {
    override fun isSuccessful(): Boolean {
        return success;
    }

    override fun getResponse(): Event? {
        return event;
    }
};



class EventImageLoader(c: Context) : AlfioAsyncTask<ByteArray, EventImageParam, EventImageResult>(c, false) {

    override fun emptyResult(): EventImageResult {
        return EventImageResult(ByteArray(0), "");
    }

    override fun work(param: EventImageParam): Pair<EventImageParam, EventImageResult> {
        val imageUrl = param.event.imageUrl ?: return param to emptyResult();
        if(imageUrl.startsWith("file:")) {
            val localImage = loadLocalImage(param.baseUrl, imageUrl, param.event);
            return param to EventImageResult(localImage.second, localImage.first);
        }
        val remoteImage = loadRemoteImage(param.baseUrl, imageUrl, param.event);
        return param to EventImageResult(remoteImage.second, remoteImage.first);
    }

    private fun loadLocalImage(baseUrl: String, imageUrl: String, event: Event) : Pair<String, ByteArray> {
        try {
            val fileName = evaluateFileName(baseUrl, event)
            val stream = caller.openFileInput(fileName);
            val channel = stream.channel;
            val buffer = ByteBuffer.allocate(channel.size().toInt())
            channel.read(buffer);
            return "file:$fileName" to buffer.array();
        } catch(e: Exception) {
            Log.e(javaClass.canonicalName, "cannot load image", e);
        }
        return loadRemoteImage(baseUrl, imageUrl, event);
    }

    private fun saveImageFile(baseUrl: String, event: Event, image: ByteArray) : String {
        if(image.size > 0) {
            try {
                val fileName = evaluateFileName(baseUrl, event)
                val stream = caller.openFileOutput(fileName, Context.MODE_PRIVATE);
                val channel = stream.channel;
                channel.write(ByteBuffer.wrap(image));
                channel.close();
                stream.close();
                return fileName;
            } catch(e: Exception) {
                Log.e(javaClass.canonicalName, "unable to persist image", e);
                return if(event.imageUrl!!.startsWith("http")) event.imageUrl!! else "$baseUrl${event.imageUrl}";
            }
        }
        return "";
    }

    private fun evaluateFileName(baseUrl: String, event: Event) = "${event.key}-${baseUrl.replace("[^A-Za-z0-9]".toRegex(), "_")}"


    private fun loadRemoteImage(baseUrl: String, imageUrl: String, event: Event) : Pair<String, ByteArray> {
        val url = if(imageUrl.startsWith("http")) imageUrl else "$baseUrl${event.imageUrl}";
        val response = eventService.loadEventImage(url);
        if(response.isSuccessful) {
            val image = response.body().bytes();
            return saveImageFile(baseUrl, event, image) to image;
        }
        return "" to ByteArray(0);
    }

}

data class EventImageParam(val baseUrl: String, val event: Event) : TaskParam;

data class EventImageResult(val image: ByteArray, val fileName: String) : TaskResult<ByteArray>, Serializable {
    override fun isSuccessful(): Boolean {
        return !image.isEmpty();
    }

    override fun getResponse(): ByteArray {
        return image;
    }

}
