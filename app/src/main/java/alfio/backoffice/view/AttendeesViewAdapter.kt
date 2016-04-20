package alfio.backoffice.view

import alfio.backoffice.R
import alfio.backoffice.data.ScanStatus
import alfio.backoffice.data.SponsorScanDescriptor
import android.support.v4.content.ContextCompat
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
            val iconDetails = getIcon(descriptor.status);
            val icon = ContextCompat.getDrawable(holder.itemView.context, iconDetails.first);
            icon.setTint(iconDetails.second);
            holder.statusImage.setImageDrawable(icon);
        }
    }

    private fun getIcon(status: ScanStatus) : Pair<Int, Int> {
        return when(status) {
            ScanStatus.DONE -> R.drawable.ic_account_circle to R.color.colorPrimary;
            ScanStatus.NEW, ScanStatus.IN_PROCESS -> R.drawable.ic_import_export to R.color.colorPrimary;
            else -> R.drawable.ic_report_problem to R.color.yellow;
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