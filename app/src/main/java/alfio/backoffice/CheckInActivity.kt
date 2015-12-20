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
package alfio.backoffice

import alfio.backoffice.task.EventDetailResult
import android.graphics.BitmapFactory
import android.os.Bundle
import android.view.View
import android.widget.Toast
import org.jetbrains.anko.*

class CheckInActivity : BaseActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        CheckInActivityUi(savedInstanceState!!).setContentView(this);
    }
}

class CheckInActivityUi(val bundle: Bundle) : AnkoComponent<CheckInActivity> {
    override fun createView(ui: AnkoContext<CheckInActivity>): View {
        val eventDetail = bundle.get("detail") as EventDetailResult;
        return with(ui) {
            verticalLayout {
                padding = dip(32);

                imageView {
                    maxHeight = dip(80);
                    setImageBitmap(BitmapFactory.decodeByteArray(eventDetail.image, 0, eventDetail.image.size));
                }

                textView {
                    textSize = 20f;
                    text = eventDetail.event!!.name;
                    textAlignment = View.TEXT_ALIGNMENT_CENTER
                }

                button("Check-in") {
                    onClick {
                        Toast.makeText(ui.ctx, "Yay!", 600);
                    }
                }

            }
        }.view();
    }
}