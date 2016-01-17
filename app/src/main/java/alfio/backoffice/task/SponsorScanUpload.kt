package alfio.backoffice.task

import android.content.Context
import com.squareup.okhttp.Response

class SponsorScanUpload(caller: Context) : TicketDetailLoader(caller) {

    override fun performRequest(param: TicketDetailParam): Response {
        return sponsorScanService.scanAttendee(param.code, param.conf);
    }
}