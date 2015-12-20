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

import alfio.backoffice.model.AlfioConfiguration
import android.content.Context
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.TextView
import org.jetbrains.anko.*

/**
 * source: https://github.com/yanex/anko-example/blob/master/app/src/main/java/org/example/ankodemo/util/ListItemAdapter.kt
 */
class ConfigurationViewAdapter(ctx: Context, val items: List<ListItem>) : ArrayAdapter<ListItem>(ctx, 0, items) {

    private val ankoContext = AnkoContext.createReusable(ctx, this);

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View? {
        val item = getItem(position)
        if (item != null) {
            val view = convertView ?: item.createView(ankoContext)
            item.apply(view)
            return view
        } else return convertView
    }

    override fun getItem(position: Int): ListItem? {
        return items[position];
    }

    override fun getItemId(position: Int): Long {
        return position.toLong();
    }

    override fun hasStableIds(): Boolean {
        return false;
    }

    override fun getCount(): Int {
        return items.size;
    }
}

interface ListItem : AnkoComponent<ConfigurationViewAdapter> {
    fun apply(convertView: View)
}

class ConfigurationListItem(val alfioConfiguration: AlfioConfiguration) : ListItem {
    var title : TextView? = null;
    var description: TextView? = null;
    protected inline fun createLinearLayout(ui: AnkoContext<ConfigurationViewAdapter>, init: LinearLayout.() -> Unit) = ui.apply {
        linearLayout {
            title = textView {
                id = android.R.id.text1
                text = "Text title"
                textSize = 17f
            }
            description = textView {
                id = android.R.id.text2
                text = "description"
                textSize = 12f
            }
            init();
        }
    }.view;

    override fun createView(ui: AnkoContext<ConfigurationViewAdapter>) = createLinearLayout(ui) {
        orientation = LinearLayout.VERTICAL;
        gravity = Gravity.AXIS_CLIP;
    }

    private fun getHolder(convertView: View): Holder {
        return (convertView.tag as? Holder) ?: Holder(title!!, description!!).apply {
            convertView.tag = this
        }
    }

    override fun apply(convertView: View) {
        val h = getHolder(convertView)
        h.title.text = alfioConfiguration.name;
        h.description.text = "${alfioConfiguration.username} on ${alfioConfiguration.url}";
    }

    internal class Holder(val title: TextView, val description: TextView)
}

class TextListItem(val text: String) : ListItem {
    protected inline fun createTextView(ui: AnkoContext<ConfigurationViewAdapter>, init: TextView.() -> Unit) = ui.apply {
        textView {
            id = android.R.id.text1
            setText("Text list item") // default text (for the preview)
            init()
        }
    }.view

    override fun createView(ui: AnkoContext<ConfigurationViewAdapter>) = createTextView(ui) {
        gravity = Gravity.CENTER_VERTICAL
        padding = ui.dip(20)
        textSize = 18f
    }

    private fun getHolder(convertView: View): Holder {
        return (convertView.tag as? Holder) ?: Holder(convertView as TextView).apply {
            convertView.tag = this
        }
    }

    override fun apply(convertView: View) {
        val h = getHolder(convertView)
        h.textView.text = text
    }

    internal class Holder(val textView: TextView)
}
