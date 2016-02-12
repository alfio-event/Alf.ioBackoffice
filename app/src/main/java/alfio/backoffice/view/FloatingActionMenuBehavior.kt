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

import android.content.Context
import android.support.design.widget.CoordinatorLayout
import android.support.design.widget.Snackbar
import android.support.v4.view.ViewCompat
import android.util.AttributeSet
import android.view.View
import com.github.clans.fab.FloatingActionMenu


/**
 * source: https://gist.github.com/lodlock/e3cd12130bad70a098db
 */
class FloatingActionMenuBehavior(context: Context, attributeSet: AttributeSet) : CoordinatorLayout.Behavior<View>() {
    private var mTranslationY: Float = 0.toFloat()

    override fun layoutDependsOn(parent: CoordinatorLayout?, child: View?, dependency: View?): Boolean {
        return dependency is Snackbar.SnackbarLayout
    }

    override fun onDependentViewChanged(parent: CoordinatorLayout, child: View?, dependency: View?): Boolean {
        if (child is FloatingActionMenu && dependency is Snackbar.SnackbarLayout) {
            this.updateTranslation(parent, child, dependency)
        }

        return false
    }

    private fun updateTranslation(parent: CoordinatorLayout, child: View, dependency: View) {
        val translationY = this.getTranslationY(parent, child)
        if (translationY != this.mTranslationY) {
            ViewCompat.animate(child).cancel()
            if (Math.abs(translationY - this.mTranslationY) == dependency.height.toFloat()) {
                ViewCompat.animate(child).translationY(translationY).setListener(null)
            } else {
                ViewCompat.setTranslationY(child, translationY)
            }

            this.mTranslationY = translationY
        }

    }

    private fun getTranslationY(parent: CoordinatorLayout, child: View): Float {
        var minOffset = 0.0f
        val dependencies = parent.getDependencies(child)
        var i = 0

        val z = dependencies.size
        while (i < z) {
            if (dependencies[i] is Snackbar.SnackbarLayout && parent.doViewsOverlap(child, dependencies[i])) {
                minOffset = Math.min(minOffset, ViewCompat.getTranslationY(dependencies[i]) - dependencies[i].height.toFloat())
            }
            ++i
        }

        return minOffset
    }

    override fun onDependentViewRemoved(parent: CoordinatorLayout, child: View?, dependency: View?) {
        if (child is FloatingActionMenu && dependency is Snackbar.SnackbarLayout) {
            this.updateTranslation(parent, child, dependency)
        }
    }
}