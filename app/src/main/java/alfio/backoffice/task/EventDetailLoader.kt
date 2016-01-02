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
import alfio.backoffice.R
import alfio.backoffice.model.Event
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.Serializable
import java.nio.ByteBuffer

class EventDetailLoader(c: Context, showProgressDialog: Boolean = true) : AlfioAsyncTask<Event, EventDetailParam, EventDetailResult>(c, showProgressDialog) {

    override fun emptyResult(): EventDetailResult {
        return EventDetailResult(false, null, ByteArray(0));
    }

    override fun work(param: EventDetailParam): Pair<EventDetailParam, EventDetailResult> {
        val response = eventService.loadSingleEvent(param.baseUrl, param.eventName);
        if(response.isSuccessful) {
            val event = Common.gson.fromJson(response.body().string(), Event::class.java);
            val image = EventImageLoader(caller).work(EventImageParam(param.baseUrl, event)).second;
            return param to EventDetailResult(true, event, image.image);
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
data class EventDetailResult(val success: Boolean, val event: Event?, val image: ByteArray) : TaskResult<Event>, Serializable {
    override fun isSuccessful(): Boolean {
        return success;
    }

    override fun getResponse(): Event? {
        return event;
    }
};



class EventImageLoader(c: Context) : AlfioAsyncTask<ByteArray, EventImageParam, EventImageResult>(c, false) {

    override fun emptyResult(): EventImageResult {
        return EventImageResult(ByteArray(0));
    }

    override fun work(param: EventImageParam): Pair<EventImageParam, EventImageResult> {
        val imageUrl = param.event.imageUrl ?: return param to emptyResult();
        val localImage = loadLocalImage(param.baseUrl, imageUrl, param.event);
        return param to EventImageResult(localImage);
    }

    private fun loadLocalImage(baseUrl: String, imageUrl: String, event: Event) : ByteArray {
        try {
            val fileName = evaluateFileName(baseUrl, event);
            if(caller.filesDir.resolve(fileName).exists()) {
                val stream = caller.openFileInput(fileName);
                val channel = stream.channel;
                val buffer = ByteBuffer.allocate(channel.size().toInt())
                channel.read(buffer);
                return buffer.array();
            }
        } catch(e: Exception) {
            Log.e(javaClass.canonicalName, "cannot load image", e);
        }
        return loadRemoteImage(baseUrl, imageUrl, event);
    }

    private fun saveImageFile(baseUrl: String, event: Event, image: ByteArray) : ByteArray {
        if(image.size > 0) {
            try {
                val fileName = evaluateFileName(baseUrl, event);
                val stream = caller.openFileOutput(fileName, Context.MODE_PRIVATE);
                val channel = stream.channel;
                val resized = resizeImage(image);
                channel.write(ByteBuffer.wrap(resized));
                channel.close();
                stream.close();
                return resized;
            } catch(e: Exception) {
                Log.e(javaClass.canonicalName, "unable to persist image", e);
                return image;
            }
        }
        return image;
    }

    /**
     * resize the image so that it would fit vertically
     */
    private fun resizeImage(image: ByteArray) : ByteArray {
        val targetHeight = caller.resources.getDimension(R.dimen.event_detail_card_height);
        val bitmap = BitmapFactory.decodeByteArray(image, 0, image.size);
        try {
            if(bitmap.height > targetHeight) {
                val toBeResized = Math.min(bitmap.height, bitmap.width);
                val ratio = targetHeight.div(toBeResized);
                val matrix = Matrix();
                matrix.postScale(ratio, ratio);
                val scaled = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, false);
                val stream = ByteArrayOutputStream();
                scaled.compress(Bitmap.CompressFormat.PNG, 100, stream);
                scaled.recycle();
                return stream.toByteArray();
            }
        } finally {
            bitmap.recycle();
        }
        return image;
    }

    private fun evaluateFileName(baseUrl: String, event: Event) = "${event.key}-${baseUrl.replace("[^A-Za-z0-9]".toRegex(), "_")}"


    private fun loadRemoteImage(baseUrl: String, imageUrl: String, event: Event) : ByteArray {
        val url = if(imageUrl.startsWith("http")) imageUrl else "$baseUrl${event.imageUrl}";
        val response = eventService.loadEventImage(url);
        if(response.isSuccessful) {
            val image = response.body().bytes();
            return saveImageFile(baseUrl, event, image);
        }
        return ByteArray(0);
    }

}

data class EventImageParam(val baseUrl: String, val event: Event) : TaskParam;

data class EventImageResult(val image: ByteArray) : TaskResult<ByteArray>, Serializable {
    override fun isSuccessful(): Boolean {
        return !image.isEmpty();
    }

    override fun getResponse(): ByteArray {
        return image;
    }

}
