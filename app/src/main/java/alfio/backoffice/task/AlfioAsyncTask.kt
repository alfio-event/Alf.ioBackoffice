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

import alfio.backoffice.service.CheckInService
import alfio.backoffice.service.EventService
import alfio.backoffice.service.SponsorScanService
import alfio.backoffice.service.UserService
import android.app.ProgressDialog
import android.content.Context
import android.os.AsyncTask
import android.support.v7.app.AlertDialog
import android.util.Log
import com.squareup.okhttp.Response
import java.util.*
import kotlin.properties.Delegates

abstract class AlfioAsyncTask<R, Param : TaskParam, Result : TaskResult<R>>(val caller: Context, val showProgressDialog: Boolean = true) : AsyncTask<Param, Void, Result>() {

    var progressDialog by Delegates.notNull<ProgressDialog>()
    var param : Param? = null
    val successCallbacks = ArrayList<(Result) -> Unit>()
    val failureCallbacks = ArrayList<(Param?, Result?) -> Unit>()
    val defaultFailureCallback : (Param?, Result?) -> Unit = { param, result ->
        val message = if(result?.hasErrorDetail() ?: false) {
            result!!.getErrorDetail()!!.message
        } else {
            caller.getString(alfio.backoffice.R.string.loading_data_failed)
        }
        AlertDialog.Builder(caller)
                .setTitle(alfio.backoffice.R.string.unexpected_error_title)
                .setMessage(message)
                .create()
                .show()
    }

    protected val eventService = EventService()
    protected val userService = UserService()
    protected val checkInService = CheckInService()
    protected val sponsorScanService = SponsorScanService()

    init {
        if(showProgressDialog) {
            progressDialog = ProgressDialog(caller)
        }
    }

    override final fun doInBackground(vararg params: Param?): Result {
        if(params.size > 0 && params[0] != null) {
            param = params[0]
            return internalDoInBackground()
        }
        return emptyResult()
    }

    private fun internalDoInBackground() : Result {
        try {
            return work(param!!).second
        } catch(e: Exception) {
            Log.w(javaClass.simpleName, e)
            return errorResult(e)
        }
    }

    protected abstract fun emptyResult() : Result

    protected abstract fun errorResult(error: Throwable): Result

    internal abstract fun work(param: Param): Pair<Param, Result>

    override fun onCancelled(result: Result?) {
        super.onCancelled(result)
    }

    override fun onPostExecute(result: Result?) {
        hideProgressDialog()
        post(result)
    }

    protected open fun post(result: Result?) {
        if(result != null && evaluateResult(result)) {
            successCallbacks.forEach { it(result); }
        } else {
            failureCallbacks.forEach { it(param, result); }
        }
    }

    protected open fun evaluateResult(result: Result) : Boolean {
        return result.isSuccessful()
    }

    override final fun onPreExecute() {
        if(showProgressDialog) {
            progressDialog.setMessage(getProgressMessage())
            progressDialog.show()
        }
    }

    protected open fun getProgressMessage() : String {
        return "Loading..."
    }

    private fun hideProgressDialog() {
        if(showProgressDialog && progressDialog.isShowing) {
            progressDialog.dismiss()
        }
    }

    override fun onCancelled() {
        AlertDialog.Builder(caller).setTitle("error").setMessage("error").show()
    }

    fun then(success: (Result) -> Unit, error: (Param?, Result?) -> Unit = defaultFailureCallback) : AlfioAsyncTask<R, Param, Result> {
        successCallbacks.add(success)
        failureCallbacks.add(error)
        return this
    }
}

interface TaskParam

abstract class TaskResult<R>(val response: R?, val error: Throwable?) {
    open fun isSuccessful() = hasError()
    fun hasError() = error == null
    open fun hasErrorDetail() = false
    open fun getErrorDetail(): Throwable? = null
}

fun <R, V:TaskResult<R>> Response.successOrEmpty(call: (Response) -> V, emptyResult: V): V {
    if(isSuccessful) {
        return call.invoke(this)
    }
    return emptyResult
}

