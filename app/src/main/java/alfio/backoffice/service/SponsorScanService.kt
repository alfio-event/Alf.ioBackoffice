package alfio.backoffice.service

import alfio.backoffice.Common
import alfio.backoffice.model.AlfioConfiguration
import com.squareup.okhttp.*

class SponsorScanService : RemoteService {
    val client = OkHttpClient();

    fun scanAttendee(code: String, conf: AlfioConfiguration) : Response = callProtectedRequest(conf, "/api/attendees/sponsor-scan", configureSinglePost(code.split("/".toRegex()).first(), conf)).invoke(client);

    fun bulkScanUpload(codes: List<String>, conf: AlfioConfiguration) : Response = callProtectedRequest(conf, "/api/attendees/sponsor-scan/bulk", configureBulkPost(codes.map({it.split("/".toRegex()).first()}), conf)).invoke(client);

    private fun configureBulkPost(ticketCodes: List<String>, conf: AlfioConfiguration) : (Request.Builder) -> Request.Builder = {builder ->
        builder.post(RequestBody.create(MediaType.parse("application/json"), Common.gson.toJson(ticketCodes.map {SponsorScanRequest(conf.eventName, it)})));
    };

    private fun configureSinglePost(ticketCode: String, conf: AlfioConfiguration) : (Request.Builder) -> Request.Builder = {builder ->
        builder.post(RequestBody.create(MediaType.parse("application/json"), Common.gson.toJson(SponsorScanRequest(conf.eventName, ticketCode))));
    };

}

data class SponsorScanRequest(val eventName: String, val ticketIdentifier: String);