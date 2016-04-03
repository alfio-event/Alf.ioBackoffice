package alfio.backoffice.service

import alfio.backoffice.Common
import alfio.backoffice.data.ConnectionState
import alfio.backoffice.data.SponsorScanManager
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.TicketAndCheckInResult
import android.util.Log
import com.google.gson.reflect.TypeToken
import com.squareup.okhttp.Response
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

object SponsorScanBackgroundUploader {

    private val executor = Executors.newScheduledThreadPool(1);
    private val sponsorScanService = SponsorScanService();
    private val scheduledJob: AtomicReference<ScheduledFuture<*>> = AtomicReference();

    fun start() {
        Log.i(this.javaClass.canonicalName, "starting SponsorScanBackgroundUploader...");
        val scheduled = scheduledJob.get();
        if(scheduled == null || scheduled.isDone) {
            val task = executor.scheduleWithFixedDelay({
                if (ConnectionState.active) {
                    Log.d(this.javaClass.canonicalName, "trying to upload...");
                    doBackgroundWork();
                } else {
                    Log.w(this.javaClass.canonicalName, "data connection is not active. Skipping execution");
                }
            }, 1L, 30L, TimeUnit.SECONDS);
            val result = scheduledJob.compareAndSet(scheduled, task);
            if(!result) {
                task.cancel(true);
                Log.i(this.javaClass.canonicalName, "failed. Someone else started it");
            }
        } else {
            Log.i(this.javaClass.canonicalName, "already running!");
        }
    }

    fun stop() {
        Log.i(this.javaClass.canonicalName, "stopping job...");
        val running = scheduledJob.get();
        if(running != null) {
            running.cancel(true);
            val result = scheduledJob.compareAndSet(running, null);
            Log.i(this.javaClass.canonicalName, "job stopped: $result");
        }
    }

    private fun doBackgroundWork() {
        SponsorScanManager.retrievePendingSponsorScan(50).flatMap {
            val key = it.key;
            it.value.zip(parseResponse(performScan(it.value, key))).map { key to it }
        }.filter {
            it.second.second.result != null && it.second.second.result!!.status.successful
        }.groupBy({it.first}, {it.second})
        .forEach {
            val result = SponsorScanManager.confirmSponsorsScan(it.key, it.value);
            Log.d(this.javaClass.canonicalName, "confirmed ${it.value.size} scans: $result");
        };
    }

    private fun parseResponse(response: Response) : List<TicketAndCheckInResult> {

        val body = response.body();
        try {
            if(response.isSuccessful) {
                return Common.gson.fromJson(body.string(), ListOfTicketAndCheckInResult().type);
            }
        } finally {
            body.close();
        }
        return emptyList();
    }

    private fun performScan(codes: List<String>, conf: AlfioConfiguration): Response {
        try {
            return sponsorScanService.bulkScanUpload(codes, conf);
        } catch(e: Exception) {
            return Response.Builder().code(500).build();
        }
    }

}

class ListOfTicketAndCheckInResult : TypeToken<List<TicketAndCheckInResult>>();