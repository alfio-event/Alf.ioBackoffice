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

import java.io.Serializable
import java.util.*

class Event : Serializable {
    var key: String? = null;
    var url: String? = null;
    var external: Boolean = false;
    var name: String? = null;
    var imageUrl: String? = null;
    var begin: Date? = null;
    var end: Date? = null;
    var oneDay: Boolean = false;
    var location: String? = null;

    override fun equals(other: Any?): Boolean{
        if (this === other) return true
        if (other?.javaClass != javaClass) return false

        other as Event

        if (key != other.key) return false
        if (url != other.url) return false
        if (external != other.external) return false
        if (name != other.name) return false
        if (imageUrl != other.imageUrl) return false
        if (begin != other.begin) return false
        if (end != other.end) return false
        if (oneDay != other.oneDay) return false
        if (location != other.location) return false

        return true
    }

    override fun hashCode(): Int{
        var result = key?.hashCode() ?: 0
        result += 31 * result + (url?.hashCode() ?: 0)
        result += 31 * result + external.hashCode()
        result += 31 * result + (name?.hashCode() ?: 0)
        result += 31 * result + (imageUrl?.hashCode() ?: 0)
        result += 31 * result + (begin?.hashCode() ?: 0)
        result += 31 * result + (end?.hashCode() ?: 0)
        result += 31 * result + oneDay.hashCode()
        result += 31 * result + (location?.hashCode() ?: 0)
        return result
    }


}
