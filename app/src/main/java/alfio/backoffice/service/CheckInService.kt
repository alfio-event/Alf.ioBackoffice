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
package alfio.backoffice.service

import alfio.backoffice.model.AlfioConfiguration
import com.squareup.okhttp.*
import java.net.URLEncoder

class CheckInService : RemoteService {

    val client = OkHttpClient();

    fun getTicketDetail(code: String, conf: AlfioConfiguration) : Response {
        val ticketId = parseQRCode(code).first;
        return callProtectedRequest(conf, "/admin/api/check-in/event/${conf.eventName}/ticket/$ticketId?qrCode=${URLEncoder.encode(code, "UTF-8")}").invoke(client);
    }

    fun checkInTicket(code: String, conf: AlfioConfiguration) : Response {
        val parsed = parseQRCode(code);
        return callProtectedRequest(conf, "/admin/api/check-in/event/${conf.eventName}/ticket/${parsed.first}", configurePost(parsed.second)).invoke(client);
    }

    fun confirmDeskPayment(code: String, conf: AlfioConfiguration) : Response {
        val parsed = parseQRCode(code);
        return callProtectedRequest(conf, "/admin/api/check-in/event/${conf.eventName}/ticket/${parsed.first}/confirm-on-site-payment", configurePost(parsed.second)).invoke(client);
    }

    private fun configurePost(ticketCode: String) : (Request.Builder) -> Request.Builder = {builder -> builder.post(RequestBody.create(MediaType.parse("application/json"), ticketCode));};

}