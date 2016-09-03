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
import android.app.Activity
import android.graphics.*
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.VectorDrawable
import android.os.Handler
import android.support.v4.content.ContextCompat
import android.support.v7.widget.RecyclerView
import android.support.v7.widget.helper.ItemTouchHelper
import android.util.TypedValue
import android.util.TypedValue.COMPLEX_UNIT_DIP
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import java.util.*
import kotlin.properties.Delegates

class ConfigurationViewAdapter(val container: Activity, val clickHandler: (AlfioConfiguration) -> Unit) : RecyclerView.Adapter<ConfigurationViewHolder>() {

    val pendingItems = WeakHashMap<AlfioConfiguration, Runnable>()
    val handler = Handler()

    override fun getItemCount(): Int {
        return AccountManager.accounts.size
    }

    override fun onBindViewHolder(holder: ConfigurationViewHolder?, position: Int) {
        val configuration = AccountManager.accounts[position]
        if(holder != null) {
            if (AccountManager.isBlacklisted(configuration)) {
                // we need to show the "undo" state of the row
                holder.itemView.setBackgroundColor(ContextCompat.getColor(container, R.color.colorPrimary))
                holder.eventData.visibility = View.GONE

                holder.undo.visibility = View.VISIBLE
                holder.undoText.text = container.getString(R.string.item_removed_successfully, configuration.event.name)
                holder.undoButton.setOnClickListener({
                    // user wants to undo the removal, let's cancel the pending task

                    val pendingRemovalRunnable = pendingItems[configuration]
                    if (pendingRemovalRunnable != null) {
                        handler.removeCallbacks(pendingRemovalRunnable)
                    }
                    pendingItems.remove(configuration)
                    AccountManager.whitelistConfiguration(configuration)
                    // this will rebind the row in "normal" state
                    notifyItemChanged(position)
                })
            } else {
                // we need to show the "normal" state
                holder.itemView.setBackgroundColor(Color.WHITE)
                holder.undo.visibility = View.GONE
                holder.setOnClickListener {
                    clickHandler.invoke(configuration)
                }
                BaseActivity.writeEventDetails(configuration.event, configuration, holder.eventDates, holder.eventDescription, holder.userDetail, holder.url, holder.eventName)
                EventImageLoader(holder.itemView.context)
                        .then({result: EventImageResult ->
                            val drawable = BitmapDrawable(holder.itemView.resources, BitmapFactory.decodeByteArray(result.image, 0, result.image.size))
                            drawable.gravity = Gravity.START or Gravity.CENTER_VERTICAL
                            holder.mainComponent.background = drawable
                        }).execute(EventImageParam(configuration.url, configuration.event))
            }
        }
    }

    fun remove(position: Int) {
        val removed = AccountManager.accounts[position]
        if(!pendingItems.containsKey(removed)) {
            AccountManager.blacklistConfiguration(removed)
            // this will redraw row in "undo" state
            notifyItemChanged(position)
            // let's create, store and post a runnable to remove the item
            val pendingRemovalRunnable = Runnable {
                AccountManager.removeAlfioConfiguration(removed)
                notifyItemRemoved(position)
            }
            handler.postDelayed(pendingRemovalRunnable, 3000L)
            pendingItems.put(removed, pendingRemovalRunnable)
        }
    }

    fun isPendingRemoval(position: Int) : Boolean {
        if(position > AccountManager.accounts.size) {
            return false
        }
        return AccountManager.isBlacklisted(AccountManager.accounts[position])
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ConfigurationViewHolder? {
        return ConfigurationViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.event_descriptor, parent, false))
    }

}

/**
 * source: https://github.com/nemanja-kovacevic/recycler-view-swipe-to-delete/blob/master/app/src/main/java/net/nemanjakovacevic/recyclerviewswipetodelete/MainActivity.java
 */
class SwipeCallback(val adapter: ConfigurationViewAdapter): ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.START or ItemTouchHelper.END) {
    val paint = Paint()
    val icon: Bitmap
        get() {
            val drawable = ContextCompat.getDrawable(adapter.container, R.drawable.ic_delete_white)
            if(drawable is BitmapDrawable) {
                return drawable.bitmap
            } else {
                drawable as VectorDrawable
                val bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                return bitmap
            }
        }
    val primaryColor: Int
        get() = ContextCompat.getColor(adapter.container, R.color.colorPrimary)
    val margin: Int
        get() = adapter.container.resources.getDimension(R.dimen.ic_clear_margin).toInt()
    val displayMetrics = adapter.container.resources.displayMetrics!!

    override fun getSwipeDirs(recyclerView: RecyclerView, viewHolder: RecyclerView.ViewHolder): Int {
        val position = viewHolder.adapterPosition
        val testAdapter = recyclerView.adapter as ConfigurationViewAdapter
        if (testAdapter.isPendingRemoval(position)) {
            return 0
        }
        return super.getSwipeDirs(recyclerView, viewHolder)
    }

    override fun onMove(recyclerView: RecyclerView?, viewHolder: RecyclerView.ViewHolder?, target: RecyclerView.ViewHolder?): Boolean {
        return false
    }

    override fun onSwiped(viewHolder: RecyclerView.ViewHolder, swipeDir: Int) {
        val swipedPosition = viewHolder.adapterPosition
        adapter.remove(swipedPosition)
    }

    override fun onChildDraw(c: Canvas?, recyclerView: RecyclerView?, viewHolder: RecyclerView.ViewHolder?, dX: Float, dY: Float, actionState: Int, isCurrentlyActive: Boolean) {
        val itemView = viewHolder!!.itemView
        if (viewHolder.adapterPosition === -1) {
            return
        }

        //source: http://stackoverflow.com/a/33344173
        if (actionState === ItemTouchHelper.ACTION_STATE_SWIPE) {
            paint.color = primaryColor
            if(dX > 0) {
                c!!.drawRect(itemView.left.toFloat(), itemView.top.toFloat(), dX, itemView.bottom.toFloat(), paint)
                c.drawBitmap(icon, (itemView.left.toFloat() + TypedValue.applyDimension(COMPLEX_UNIT_DIP, margin.toFloat(), displayMetrics)),
                        itemView.top.toFloat() + (itemView.bottom.toFloat() - itemView.top.toFloat() - icon.height.toFloat()) / 2, paint)
            } else {
                c!!.drawRect(itemView.right.toFloat() + dX, itemView.top.toFloat(), itemView.right.toFloat(), itemView.bottom.toFloat(), paint)
                c.drawBitmap(icon, (itemView.right.toFloat() - TypedValue.applyDimension(COMPLEX_UNIT_DIP, margin.toFloat(), displayMetrics) - icon.width),
                        itemView.top.toFloat() + (itemView.bottom.toFloat() - itemView.top.toFloat() - icon.height.toFloat()) / 2, paint)
            }
        }
        super.onChildDraw(c, recyclerView, viewHolder, dX, dY, actionState, isCurrentlyActive)
    }

    override fun isLongPressDragEnabled() = false
    override fun isItemViewSwipeEnabled(): Boolean = true
}

class ConfigurationViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {

    var mainComponent by Delegates.notNull<View>()
    var eventDates by Delegates.notNull<TextView>()
    var eventDescription by Delegates.notNull<TextView>()
    var userDetail by Delegates.notNull<TextView>()
    var eventName by Delegates.notNull<TextView>()
    var url by Delegates.notNull<TextView>()
    var undo by Delegates.notNull<View>()
    var undoText by Delegates.notNull<TextView>()
    var undoButton by Delegates.notNull<Button>()
    var eventData by Delegates.notNull<View>()

    init {
        mainComponent = itemView.findViewById(R.id.eventLogoContainer)
        eventDates = itemView.findViewById(R.id.eventDates) as TextView
        eventDescription = itemView.findViewById(R.id.eventDescription) as TextView
        userDetail = itemView.findViewById(R.id.userDetail) as TextView
        eventName = itemView.findViewById(R.id.eventName) as TextView
        url = itemView.findViewById(R.id.baseUrl) as TextView
        undo = itemView.findViewById(R.id.undo) as View
        undoText = itemView.findViewById(R.id.undoText) as TextView
        eventData = itemView.findViewById(R.id.eventData) as View
        undoButton = itemView.findViewById(R.id.undoButton) as Button
    }

    fun setOnClickListener(listener: (View) -> Unit) {
        itemView.setOnClickListener(listener)
    }
}

/**
 * source: https://github.com/nemanja-kovacevic/recycler-view-swipe-to-delete/blob/master/app/src/main/java/net/nemanjakovacevic/recyclerviewswipetodelete/MainActivity.java
 */
class ConfigurationItemDecoration(val color: Int) : RecyclerView.ItemDecoration() {
    val background: Drawable
        get() = ColorDrawable(color)

    override fun onDraw(c: Canvas, parent: RecyclerView, state: RecyclerView.State) {

        // only if animation is in progress
        if (parent.itemAnimator.isRunning) {

            // some items might be animating down and some items might be animating up to close the gap left by the removed item
            // this is not exclusive, both movement can be happening at the same time
            // to reproduce this leave just enough items so the first one and the last one would be just a little off screen
            // then remove one from the middle

            // find first child with translationY > 0
            // and last one with translationY < 0
            // we're after a rect that is not covered in recycler-view views at this point in time
            var lastViewComingDown: View? = null
            var firstViewComingUp: View? = null

            // this is fixed
            val left = 0
            val right = parent.width

            // this we need to find out
            var top = 0
            var bottom = 0

            // find relevant translating views
            val childCount = parent.layoutManager.childCount
            for (i in 0..childCount - 1) {
                val child = parent.layoutManager.getChildAt(i)
                if (child.translationY < 0) {
                    // view is coming down
                    lastViewComingDown = child
                } else if (child.translationY > 0) {
                    // view is coming up
                    if (firstViewComingUp == null) {
                        firstViewComingUp = child
                    }
                }
            }

            if (lastViewComingDown != null && firstViewComingUp != null) {
                // views are coming down AND going up to fill the void
                top = lastViewComingDown.bottom + lastViewComingDown.translationY.toInt()
                bottom = firstViewComingUp.top + firstViewComingUp.translationY.toInt()
            } else if (lastViewComingDown != null) {
                // views are going down to fill the void
                top = lastViewComingDown.bottom + lastViewComingDown.translationY.toInt()
                bottom = lastViewComingDown.bottom
            } else if (firstViewComingUp != null) {
                // views are coming up to fill the void
                top = firstViewComingUp.top
                bottom = firstViewComingUp.top + firstViewComingUp.translationY.toInt()
            }

            background.setBounds(left, top, right, bottom)
            background.draw(c)
        }
        super.onDraw(c, parent, state)
    }
}