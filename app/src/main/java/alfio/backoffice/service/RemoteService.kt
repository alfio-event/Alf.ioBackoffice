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

import alfio.backoffice.Common
import alfio.backoffice.model.AlfioConfiguration
import android.util.Base64
import com.squareup.okhttp.OkHttpClient
import com.squareup.okhttp.Request
import com.squareup.okhttp.Response
import java.nio.charset.Charset

interface RemoteService {

    fun callProtectedRequest(conf: AlfioConfiguration, serviceUrl: String, requestTransformer: (Request.Builder) -> Request.Builder = {builder -> builder.get()}) : (OkHttpClient) -> Response = { client ->
        val builder = requestTransformer(Request.Builder()
                .addHeader("Authorization", getAuthorizationHeader(conf.username, conf.password))
                .url(conf.url + serviceUrl));
        client.newCall(builder.build()).execute();
    }

    fun getAuthorizationHeader(username: String, password: String): String {
        val basicAuth = username + ":" + password;
        val encoded: ByteArray = basicAuth.toByteArray(Charset.forName("UTF-8"));
        return "Basic "+ Base64.encodeToString(encoded, Base64.NO_WRAP);
    }

    fun parseQRCode(code: String) : Pair<String, String> = code.split("/".toRegex()).first() to Common.gson.toJson(TicketCode(code));

    class TicketCode(val code: String) {
    }

}