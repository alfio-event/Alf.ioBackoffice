package alfio.backoffice.task

import alfio.backoffice.Common
import alfio.backoffice.data.SponsorScanManager
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.Ticket
import alfio.backoffice.model.TicketAndCheckInResult
import android.content.Context
import java.io.Serializable

class SponsorScanUpload(caller: Context) : AlfioAsyncTask<String, SponsorScanUploadParam, SponsorScanResult>(caller) {

    override fun emptyResult(): SponsorScanResult = SponsorScanResult(null)
    override fun errorResult(error: Throwable) = SponsorScanResult(null, error=error)

    override fun work(param: SponsorScanUploadParam): Pair<SponsorScanUploadParam, SponsorScanResult> {
        if(SponsorScanManager.offlineScanEnabled) {
            SponsorScanManager.enqueueSponsorScan(param.conf, param.code)
            return param to SponsorScanResult(param.code)
        } else {
            val response = sponsorScanService.scanAttendee(param.code, param.conf)
            response.body().use { body ->
                if(response.isSuccessful) {
                    val scanResult = Common.gson.fromJson(body.string(), TicketAndCheckInResult::class.java)
                    if(scanResult.result?.status?.successful ?: false) {
                        SponsorScanManager.enqueueSuccessfulSponsorScan(param.conf, param.code, scanResult.ticket!!)
                        return param to SponsorScanResult(param.code, ticket = scanResult.ticket)
                    }
                    return param to emptyResult()
                } else {
                    return param to emptyResult()
                }
            }
        }
    }
}

class SponsorScanResult(code: String?, error: Throwable? = null, val ticket: Ticket? = null) : TaskResult<String>(code, error), Serializable {
    override fun isSuccessful(): Boolean {
        return response != null && super.isSuccessful()
    }
    fun hasTicket() : Boolean = ticket != null
}
class SponsorScanUploadParam(val conf: AlfioConfiguration, val code: String) : TaskParam

val SCAN_ENQUEUED_STATUS = 204