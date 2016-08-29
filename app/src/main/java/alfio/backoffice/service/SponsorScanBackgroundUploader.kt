package alfio.backoffice.service

import alfio.backoffice.Common
import alfio.backoffice.data.ConnectionState
import alfio.backoffice.data.SponsorScanManager
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.CheckInResult
import alfio.backoffice.model.TicketAndCheckInResult
import android.util.Log
import com.google.gson.reflect.TypeToken
import com.squareup.okhttp.Response
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

object SponsorScanBackgroundUploader {

    private val executor = Executors.newScheduledThreadPool(1)
    private val sponsorScanService = SponsorScanService()
    private val scheduledJob: AtomicReference<ScheduledFuture<*>> = AtomicReference()

    fun start() {
        Log.i(this.javaClass.canonicalName, "starting SponsorScanBackgroundUploader...")
        val scheduled = scheduledJob.get()
        if(scheduled == null || scheduled.isDone) {
            val task = executor.scheduleWithFixedDelay({
                if (ConnectionState.active) {
                    Log.i(this.javaClass.canonicalName, "trying to upload sponsors scan...")
                    doBackgroundWork()
                } else {
                    Log.w(this.javaClass.canonicalName, "data connection is not active. Skipping execution")
                }
            }, 1L, 30L, TimeUnit.SECONDS)
            val result = scheduledJob.compareAndSet(scheduled, task)
            if(!result) {
                task.cancel(true)
                Log.i(this.javaClass.canonicalName, "failed. Someone else started it")
            }
        } else {
            Log.i(this.javaClass.canonicalName, "already running!")
        }
    }

    fun stop() {
        Log.i(this.javaClass.canonicalName, "stopping job...")
        val running = scheduledJob.get()
        if(running != null) {
            running.cancel(true)
            val result = scheduledJob.compareAndSet(running, null)
            Log.i(this.javaClass.canonicalName, "job stopped: $result")
        }
    }

    private fun doBackgroundWork() {
        val partitioned = SponsorScanManager.retrievePendingSponsorScan(50).flatMap {
            val key = it.key
            val responses = performUpload(key, it.value)
            it.value.zip(responses).map { key to it }
        }.partition { it.second.second.result != null && it.second.second.result!!.status.successful }

        partitioned.first
                .groupBy({it.first}, {it.second})
                .forEach {
                    val result = SponsorScanManager.confirmSponsorsScan(it.key, it.value)
                    Log.d(this.javaClass.canonicalName, "confirmed ${it.value.size} scans: $result")
                }
        partitioned.second.forEach {
            SponsorScanManager.registerScanError(it.first, it.second)
        }
    }

    private fun performUpload(conf: AlfioConfiguration, codes: List<String>) : List<TicketAndCheckInResult> {
        if(conf.event.apiVersion >= 17) {
            return parseResponse(performBulkUpload(codes, conf))
        }
        return codes.map {
            performSingleUpload(it, conf)
        }.map {
            val body = it.body()
            val result: TicketAndCheckInResult
            if(it.isSuccessful) {
                result = Common.gson.fromJson(body.string(), TicketAndCheckInResult::class.java)
            } else {
                result = TicketAndCheckInResult()
                result.result = CheckInResult()//ticket not found
            }
            body.close()
            result
        }
    }

    private fun parseResponse(response: Response) : List<TicketAndCheckInResult> {
        val body = response.body()
        try {
            if(response.isSuccessful) {
                return Common.gson.fromJson(body.string(), ListOfTicketAndCheckInResult().type)
            }
        } finally {
            body.close()
        }
        return emptyList()
    }

    private fun performSingleUpload(code: String, conf: AlfioConfiguration): Response {
        return performCall { sponsorScanService.scanAttendee(code, conf) }
    }

    private fun performBulkUpload(codes: List<String>, conf: AlfioConfiguration): Response {
        return performCall { sponsorScanService.bulkScanUpload(codes, conf) }
    }

    private fun performCall(call: () -> Response) : Response {
        try {
            return call.invoke()
        } catch (e: Exception) {
            return Response.Builder().code(500).build()
        }
    }

}

class ListOfTicketAndCheckInResult : TypeToken<List<TicketAndCheckInResult>>()