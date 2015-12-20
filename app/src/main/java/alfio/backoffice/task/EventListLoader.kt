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
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.Event
import alfio.backoffice.service.DataService
import alfio.backoffice.service.EventService
import android.app.AlertDialog
import android.app.ProgressDialog
import android.os.AsyncTask
import android.support.v7.app.AppCompatActivity
import java.util.*

class EventListLoader(val caller: AppCompatActivity, val dataService: DataService): AsyncTask<EventListLoaderCommand, Int, Pair<EventListLoaderCommand, EventListLoaderResult>>() {

    val eventService = EventService();
    val progressDialog = ProgressDialog(caller);
    val successCallbacks = ArrayList<(AlfioConfiguration) -> Unit>();
    val failureCallbacks = ArrayList<(EventListLoaderResult) -> Unit>();
    val emptyFailedResult = EventListLoaderResult(false, null);

    override fun doInBackground(vararg params: EventListLoaderCommand?): Pair<EventListLoaderCommand, EventListLoaderResult>? {
        params.forEach {
            if(it != null) {
                val response = eventService.loadUserEvents(it.baseUrl, it.username, it.password);
                if(response.isSuccessful) {
                    return it to EventListLoaderResult(true, response.body().string());
                }
                return it to EventListLoaderResult(false, null);
            }
        }
        return null;
    }

    override fun onPreExecute() {
        progressDialog.setMessage("Loading events...");
        progressDialog.show();
    }

    override fun onCancelled() {
        AlertDialog.Builder(caller).setTitle("error").setMessage("error").show()
    }

    override fun onPostExecute(result: Pair<EventListLoaderCommand, EventListLoaderResult>?) {

        if(result != null && result.second.success) {
            val response = result.second;
            val command = result.first;
            val events: List<Event> = Common.gson.fromJson(response.responseBody, EventService.ListOfEvents().type);
            hideProgressDialog();
            val filteredEvents = events.filter { !it.external };
            AlertDialog.Builder(caller)
                    .setTitle(R.string.dialog_select_event_title)
                    .setItems(filteredEvents.map { it.name }.toTypedArray(), {
                        dialog, which ->
                        val event = filteredEvents[which];
                        val configuration = AlfioConfiguration(event.name!!, event.key!!, command.baseUrl, command.username, command.password);
                        dataService.saveAlfioConfiguration(configuration);
                        successCallbacks.forEach { it(configuration); };
                    })
                    .show();
        } else {
            hideProgressDialog();
            failureCallbacks.forEach { it( if(result != null) result.second else emptyFailedResult) }
        }
    }

    private fun hideProgressDialog() {
        if(progressDialog.isShowing) {
            progressDialog.dismiss();
        }
    }

    fun onSuccess(callback: (AlfioConfiguration) -> Unit) : EventListLoader {
        successCallbacks.add(callback);
        return this;
    }

    fun onFailure(callback: (EventListLoaderResult) -> Unit) : EventListLoader {
        failureCallbacks.add(callback);
        return this;
    }


}

data class EventListLoaderCommand(val baseUrl: String, val username: String, val password: String);
data class EventListLoaderResult(val success: Boolean, val responseBody: String?);
