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
import alfio.backoffice.data.ConnectionState
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.Event
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.Serializable
import java.nio.ByteBuffer

class EventDetailLoader(c: Context, showProgressDialog: Boolean = true, val isSponsor: Boolean = false) : AlfioAsyncTask<Event, EventDetailParam, EventDetailResult>(c, showProgressDialog) {

    override fun errorResult(error: Throwable) = EventDetailResult(false, null, ByteArray(0), error)

    override fun emptyResult() = EventDetailResult(false, null, ByteArray(0))

    override fun work(param: EventDetailParam): Pair<EventDetailParam, EventDetailResult> {
        val event = loadEvent(param)
        return if(event.first) {
            val image = EventImageLoader(caller).work(EventImageParam(param.configuration)).second
            param to EventDetailResult(true, event.second, image.image)
        } else {
            param to emptyResult()
        }
    }

    private fun loadEvent(param: EventDetailParam): Pair<Boolean, Event> {
        try {
            if(!ConnectionState.active) {
                return true to param.configuration.event
            }
            val response = eventService.loadSingleEvent(param.configuration)
            val body = response.body()
            if(response.isSuccessful) {
                return true to Common.gson.fromJson(body.string(), Event::class.java)
            }
            body.close()
            return false to param.configuration.event
        } catch(e: Exception) {
            return true to param.configuration.event
        }
    }

}

data class EventDetailParam(val configuration: AlfioConfiguration) : TaskParam {
    val baseUrl: String
        get() = configuration.url
    val eventName: String
        get() = configuration.eventName
}

class EventDetailResult(val success: Boolean, val event: Event?, val image: ByteArray, error: Throwable? = null) : TaskResult<Event>(event, error), Serializable {
    override fun isSuccessful(): Boolean {
        return success
    }
}

class EventImageLoader(c: Context) : AlfioAsyncTask<ByteArray, EventImageParam, EventImageResult>(c, false) {

    override fun emptyResult() = EventImageResult(ByteArray(0))

    override fun errorResult(error: Throwable) = EventImageResult(ByteArray(0))

    override fun work(param: EventImageParam): Pair<EventImageParam, EventImageResult> {
        return if(param.configuration.event.imageUrl != null) {
            val localImage = loadLocalImage(param.configuration)
            param to EventImageResult(localImage)
        } else {
            param to emptyResult()
        }
    }

    private fun loadLocalImage(configuration: AlfioConfiguration) : ByteArray {
        try {
            val fileName = evaluateFileName(configuration.url, configuration.event)
            if(caller.filesDir.resolve(fileName).exists()) {
                val stream = caller.openFileInput(fileName)
                val channel = stream.channel
                val buffer = ByteBuffer.allocate(channel.size().toInt())
                channel.read(buffer)
                return buffer.array()
            }
        } catch(e: Exception) {
            Log.e(javaClass.canonicalName, "cannot load image", e)
        }

        return if(ConnectionState.active) {
            loadRemoteImage(configuration)
        } else {
            ByteArray(0)
        }
    }

    private fun saveImageFile(baseUrl: String, event: Event, image: ByteArray) : ByteArray {
        if(image.isNotEmpty()) {
            try {
                val fileName = evaluateFileName(baseUrl, event)
                val stream = caller.openFileOutput(fileName, Context.MODE_PRIVATE)
                val channel = stream.channel
                val resized = resizeImage(image)
                channel.write(ByteBuffer.wrap(resized))
                channel.close()
                stream.close()
                return resized
            } catch(e: Exception) {
                Log.e(javaClass.canonicalName, "unable to persist image", e)
                return image
            }
        }
        return image
    }

    /**
     * resize the image so that it would fit vertically
     */
    private fun resizeImage(image: ByteArray) : ByteArray {
        val targetHeight = caller.resources.getDimension(R.dimen.event_detail_card_height)
        val bitmap = BitmapFactory.decodeByteArray(image, 0, image.size)
        try {
            if(bitmap.height > targetHeight) {
                val toBeResized = Math.min(bitmap.height, bitmap.width)
                val ratio = targetHeight.div(toBeResized)
                val matrix = Matrix()
                matrix.postScale(ratio, ratio)
                val scaled = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, false)
                val stream = ByteArrayOutputStream()
                scaled.compress(Bitmap.CompressFormat.PNG, 100, stream)
                scaled.recycle()
                return stream.toByteArray()
            }
        } finally {
            bitmap.recycle()
        }
        return image
    }

    private fun evaluateFileName(baseUrl: String, event: Event) = "${event.key}-${baseUrl.replace("[^A-Za-z0-9]".toRegex(), "_")}"


    private fun loadRemoteImage(configuration: AlfioConfiguration) : ByteArray {
        val response = eventService.loadEventImage(configuration)
        return if(response.isSuccessful) {
            response.body().use { body ->
                val image = body.bytes()
                saveImageFile(configuration.url, configuration.event, image)
            }
        } else {
            ByteArray(0)
        }
    }

}

data class EventImageParam(val configuration: AlfioConfiguration) : TaskParam

class EventImageResult(val image: ByteArray, error: Throwable? = null) : TaskResult<ByteArray>(image, error), Serializable {
    override fun isSuccessful(): Boolean {
        return !image.isEmpty()
    }
}
