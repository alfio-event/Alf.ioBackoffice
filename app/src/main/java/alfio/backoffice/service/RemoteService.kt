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
import alfio.backoffice.model.ConnectionConfiguration
import android.util.Base64
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.nio.charset.Charset
import javax.net.ssl.SSLContext

interface RemoteService {

    fun callProtectedRequest(conf: ConnectionConfiguration, serviceUrl: String, requestTransformer: (Request.Builder) -> Request.Builder = Request.Builder::get) : (OkHttpClient) -> Response = { client ->
        val builder = requestTransformer(Request.Builder()
                .addHeader("Authorization", getAuthorizationHeader(conf.username, conf.password))
                .url("${conf.url}$serviceUrl"))
        configureSsl(conf, client).newCall(builder.build()).execute()
    }

    fun callUnprotectedRequest(conf: ConnectionConfiguration, serviceUrl: String) : (OkHttpClient) -> Response = { client ->
        val builder = Request.Builder().url("${conf.url}$serviceUrl")
        configureSsl(conf, client).newCall(builder.build()).execute()
    }

    fun getAuthorizationHeader(username: String, password: String): String {
        val basicAuth = username + ":" + password
        val encoded: ByteArray = basicAuth.toByteArray(Charset.forName("UTF-8"))
        return "Basic "+ Base64.encodeToString(encoded, Base64.NO_WRAP)
    }

    fun parseQRCode(code: String) : Pair<String, String> = code.split("/".toRegex()).first() to Common.gson.toJson(TicketCode(code))

    class TicketCode(val code: String)

    private fun configureSsl(conf: ConnectionConfiguration, client: OkHttpClient): OkHttpClient {

        return if(conf.needsSslConfig()) {
            val sslContext = SSLContext.getInstance("TLS")
            sslContext.init(null, arrayOf(conf.sslTrustManager), null)
            client.newBuilder()
                    .sslSocketFactory(sslContext.socketFactory, conf.sslTrustManager)
                    .hostnameVerifier({hostname, session ->
                        Log.i("RemoteService", "Approving certificate for $hostname")
                        true
                    }).build()
        } else {
            client
        }
    }

}

internal val httpClient = OkHttpClient()