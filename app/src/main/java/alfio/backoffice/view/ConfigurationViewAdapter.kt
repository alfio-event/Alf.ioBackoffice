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
package alfio.backoffice.view

import alfio.backoffice.BaseActivity
import alfio.backoffice.R
import alfio.backoffice.data.AccountManager
import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.task.EventImageLoader
import alfio.backoffice.task.EventImageParam
import alfio.backoffice.task.EventImageResult
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.support.v7.widget.RecyclerView
import android.support.v7.widget.helper.ItemTouchHelper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import kotlin.properties.Delegates

class ConfigurationViewAdapter(val clickHandler: (AlfioConfiguration) -> Unit) : RecyclerView.Adapter<ViewHolder>() {

    var itemRemovedListener: ((AlfioConfiguration) -> Unit)? = null;

    override fun getItemCount(): Int {
        return AccountManager.accounts.size;
    }

    override fun onBindViewHolder(holder: ViewHolder?, position: Int) {
        val configuration = AccountManager.accounts[position];
        if(holder != null) {
            holder.setOnClickListener {
                clickHandler.invoke(configuration);
            }
            BaseActivity.writeEventDetails(configuration.event, configuration, holder.eventDates, holder.eventDescription, holder.userDetail, holder.url, holder.eventName);
            EventImageLoader(holder.itemView.context)
                    .then({result: EventImageResult ->
                        val drawable = BitmapDrawable(holder.itemView.resources, BitmapFactory.decodeByteArray(result.image, 0, result.image.size));
                        drawable.gravity = Gravity.LEFT or Gravity.CENTER_VERTICAL;
                        holder.mainComponent.background = drawable;
                    }).execute(EventImageParam(configuration.url, configuration.event));
        }
    }

    fun remove(position: Int) {
        val removed = AccountManager.accounts[position];
        AccountManager.blacklistConfiguration(removed);
        notifyItemRemoved(position);
        itemRemovedListener?.invoke(removed);
    }

    fun rangeChanged() {
        super.notifyItemRangeChanged(0, AccountManager.accounts.size);
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder? {
        return ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.event_descriptor, parent, false));
    }

}

class SwipeCallback(val adapter: ConfigurationViewAdapter): ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.END) {

    override fun onMove(recyclerView: RecyclerView?, viewHolder: RecyclerView.ViewHolder?, target: RecyclerView.ViewHolder?): Boolean {
        return false;
    }

    override fun onSwiped(viewHolder: RecyclerView.ViewHolder?, swipeDir: Int) {
        adapter.remove(viewHolder!!.adapterPosition);
    }

    override fun isLongPressDragEnabled() = false;
    override fun isItemViewSwipeEnabled(): Boolean = adapter.itemRemovedListener != null;
}

class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {

    var mainComponent by Delegates.notNull<View>();
    var eventDates by Delegates.notNull<TextView>();
    var eventDescription by Delegates.notNull<TextView>();
    var userDetail by Delegates.notNull<TextView>();
    var eventName by Delegates.notNull<TextView>();
    var url by Delegates.notNull<TextView>();

    init {
        mainComponent = itemView.findViewById(R.id.eventLogoContainer);
        eventDates = itemView.findViewById(R.id.eventDates) as TextView;
        eventDescription = itemView.findViewById(R.id.eventDescription) as TextView;
        userDetail = itemView.findViewById(R.id.userDetail) as TextView;
        eventName = itemView.findViewById(R.id.eventName) as TextView;
        url = itemView.findViewById(R.id.baseUrl) as TextView;
    }

    fun setOnClickListener(listener: (View) -> Unit) {
        itemView.setOnClickListener(listener);
    }
}