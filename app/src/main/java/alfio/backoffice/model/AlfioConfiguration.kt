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
package alfio.backoffice.model

import alfio.backoffice.GsonTransient
import java.io.ByteArrayInputStream
import java.io.Serializable
import java.security.KeyStore
import java.security.cert.CertificateFactory
import java.util.*
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

open class ConnectionConfiguration(val url: String, val username: String, val password: String, val sslCert: String?) : Serializable {
    @GsonTransient val sslTrustManager: X509TrustManager?
        get() = if(needsSslConfig()) {
            val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
            val password = UUID.randomUUID().toString().toCharArray()
            keyStore.load(null, password)
            val certificate = "-----BEGIN CERTIFICATE-----\n$sslCert\n-----END CERTIFICATE-----"
            val (host, port) = Regex("^https://(.*?)(:[0-9]+)?").find(url)!!.destructured
            keyStore.setCertificateEntry(host, CertificateFactory.getInstance("X.509").generateCertificate(ByteArrayInputStream(certificate.toByteArray())))
            val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
            keyManagerFactory.init(keyStore, password)
            val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
            trustManagerFactory.init(keyStore)
            trustManagerFactory.trustManagers[0] as X509TrustManager
        } else {
            null
        }

    fun needsSslConfig(): Boolean = sslCert != null
}

class AlfioConfiguration(url: String, username: String, password: String, sslCert: String?, val userType: UserType, val event: Event) : ConnectionConfiguration(url, username, password, sslCert), Serializable {
    val name : String
        get() = event.name!!
    val eventName : String
        get() = event.key!!
    val imageUrl : String?
        get() = event.imageUrl
    val key = "$username@$eventName@$url"
}
