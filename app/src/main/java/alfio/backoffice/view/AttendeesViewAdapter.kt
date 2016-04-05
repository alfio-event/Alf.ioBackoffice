package alfio.backoffice.view

import alfio.backoffice.R
import alfio.backoffice.data.ScanStatus
import alfio.backoffice.data.SponsorScanDescriptor
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.support.v7.widget.RecyclerView
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import kotlin.properties.Delegates

class AttendeesViewAdapter(val scanDescriptors : List<SponsorScanDescriptor>) : RecyclerView.Adapter<AttendeesViewHolder>() {

    override fun onBindViewHolder(holder: AttendeesViewHolder?, position: Int) {
        if(holder != null) {
            val descriptor = scanDescriptors[position];
            holder.attendeeName.text = descriptor.ticket?.fullName ?: descriptor.code;
            holder.attendeeEmail.text = descriptor.ticket?.email ?: "";
            holder.statusImage.setImageDrawable(BitmapDrawable(holder.itemView.resources, BitmapFactory.decodeResource(holder.itemView.resources, getIcon(descriptor.status))));
        }
    }

    private fun getIcon(status: ScanStatus) : Int {
        return when(status) {
            ScanStatus.DONE -> R.mipmap.ic_contact_mail;
            ScanStatus.NEW, ScanStatus.IN_PROCESS -> R.mipmap.ic_import_export;
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AttendeesViewHolder? {
        return AttendeesViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.attendee_descriptor, parent, false));
    }

    override fun getItemCount(): Int {
        return scanDescriptors.size;
    }
}

class AttendeesViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
    var attendeeName by Delegates.notNull<TextView>();
    var attendeeEmail by Delegates.notNull<TextView>();
    var statusImage by Delegates.notNull<ImageView>();

    init {
        attendeeName = itemView.findViewById(R.id.attendeeName) as TextView;
        attendeeEmail = itemView.findViewById(R.id.attendeeEmail) as TextView;
        statusImage = itemView.findViewById(R.id.statusImage) as ImageView;
    }
}