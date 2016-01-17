package alfio.backoffice.service

import alfio.backoffice.Common
import alfio.backoffice.model.AlfioConfiguration
import com.squareup.okhttp.*

class SponsorScanService : RemoteService {
    val client = OkHttpClient();

    fun scanAttendee(code: String, conf: AlfioConfiguration) : Response = callProtectedRequest(conf, "/api/attendees/sponsor-scan", configurePost(code.split("/".toRegex()).first(), conf)).invoke(client);

    private fun configurePost(ticketCode: String, conf: AlfioConfiguration) : (Request.Builder) -> Request.Builder = {builder ->
        builder.post(RequestBody.create(MediaType.parse("application/json"), Common.gson.toJson(SponsorScanRequest(conf.eventName, ticketCode))));
    };

}

data class SponsorScanRequest(val eventName: String, val ticketIdentifier: String);