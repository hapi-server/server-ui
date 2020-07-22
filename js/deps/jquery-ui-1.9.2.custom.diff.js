--- jquery-ui-1.9.2.custom.js	2020-07-19 09:56:31.000000000 -0400
+++ jquery-ui-1.9.2.custom.patched.js	2020-07-19 09:56:32.000000000 -0400
@@ -3,6 +3,8 @@
 * Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.position.js, jquery.ui.autocomplete.js, jquery.ui.datepicker.js, jquery.ui.menu.js
 * Copyright jQuery Foundation and other contributors; Licensed MIT */
 
+var fastmode = true; // Speed up rendering of drop-down lists.
+
 (function( $, undefined ) {
 
 var uuid = 0,
@@ -1620,6 +1622,10 @@
 				var item = ui.item.data( "ui-autocomplete-item" ) || ui.item.data( "item.autocomplete" ),
 					previous = this.previous;
 
+				if (fastmode) {
+					item = {value: $(ui.item[0]).attr('id')};
+				}
+
 				// only trigger when focus was lost (click on menu)
 				if ( this.element[0] !== this.document[0].activeElement ) {
 					this.element.focus();
@@ -1843,7 +1849,9 @@
 			.empty()
 			.zIndex( this.element.zIndex() + 1 );
 		this._renderMenu( ul, items );
-		this.menu.refresh();
+		if (!fastmode) {
+			this.menu.refresh();
+		}
 
 		// size and position menu
 		ul.show();
@@ -1869,9 +1877,36 @@
 
 	_renderMenu: function( ul, items ) {
 		var that = this;
-		$.each( items, function( index, item ) {
-			that._renderItemData( ul, item );
-		});
+		if (fastmode) {
+			txt = "";
+			if (this.term.length == 0) {
+				for (let i = 0; i < items.length; i++) {
+					txt = txt + "<li id='" 
+								+ items[i].value 
+								+ "' class='ui-menu-item' role='presentation'>"
+								+ "<a id='ui-id-" + (i) + "' class='ui-corner-all' tabindex='-1'>" 
+								+ items[i].label
+								+ "</a></li>";
+				}
+			} else {
+				var re = new RegExp( "(" + this.term + ")", "gi" );
+				cls = "ui-state-highlight";
+				template = "<span class='" + cls + "'>$1</span>";
+				for (let i = 0; i < items.length; i++) {
+					txt = txt + "<li id='" 
+								+ items[i].value 
+								+ "' class='ui-menu-item' role='presentation'>"
+								+ "<a id='ui-id-" + (i) + "' class='ui-corner-all' tabindex='-1'>" 
+								+ items[i].label.replace(re,template)
+								+ "</a></li>";
+				}
+			}
+			$(ul).append(txt);
+		} else {
+			$.each( items, function( index, item ) {
+				that._renderItemData( ul, item );
+			});
+		}
 	},
 
 	_renderItemData: function( ul, item ) {
