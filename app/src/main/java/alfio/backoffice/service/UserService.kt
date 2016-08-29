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

import com.squareup.okhttp.OkHttpClient
import com.squareup.okhttp.Request
import com.squareup.okhttp.Response

class UserService : RemoteService {

    val client = OkHttpClient()

    fun loadUserType(baseUrl: String, username: String, password: String) : Response {
        val request = Request.Builder()
                .addHeader("Authorization", getAuthorizationHeader(username, password))
                .get()
                .url("$baseUrl/admin/api/user-type")
                .build()
        return client.newCall(request).execute()
    }
}
