function dropdowns(ids, funs, after, i) {
	
	if (i === undefined) {
		i = 0;
	}

	if (i == ids.length) {
		log("dropdowns(): Last drop-down already set. Returning.");
		return;
	}

	function settoggle(i) {

		$("#"+ids[i]+"list").unbind('click');
		log("dropdowns.settoggle(): Setting click event on "
					+ ids[i] + "list element.");
		$("#" + ids[i] + "list").
			click(function () {
				// Note that search event is not defined.
				log("dropdowns.settoggle.click(): Removing text from "
							+ ids[i] 
							+ "list entry area and binding AJAX search event.");
				$("#" + ids[i])
						.attr('valuelast', $("#" + ids[i]).attr('value'))
						.attr('value','')
						.css('color','black')
						.autocomplete('search')
						.focus();
			});
	}

	function showvalues(id, ui) {
		let value     = $('input[id=' + id + ']').parent().parent().attr('value');
		let valuelast = $('input[id=' + id + ']').parent().parent().attr('valuelast');

		console.log("value         = " + value);
		console.log("valuelast     = " + valuelast);
		if (ui && ui.item) {
			console.log("ui.value      = " + ui.item.value);
			console.log("ui.valuelast  = " + ui.item.valuelast);
		} else {
			console.log("ui.item.value      = undefined");
			console.log("ui.item.valuelast  = undefined");
		}
	}
	function ac(i, list) {	

		$("#" + ids[i])
			.autocomplete({
				source: list,
				scroll: true,
				minLength: 0,
				open: function (event, ui) {
					// Triggered when list is shown or modified due to typing.

					var id = $(this).attr('id');
					log("dropdowns.ac.open(): Open event on " + id + ".");
					showvalues(id, ui);
					log("dropdowns.ac.open(): Binding blur event on id = " + id);

					$('input[id=' + id + ']').blur(function () {
						id = $(this).attr('id');
						log("dropdowns.ac.blur(): Blur event triggered on id = " + id + ".");
						showvalues(id, ui)

						function reset(el) {
							log("dropdowns.ac.reset(): Called.");
							showvalues(id, ui)
							if (!$(el).attr('value')) {
								log("dropdowns.ac.reset(): Resetting to " + $(el).attr('label'));
								$("#"+id)
									.attr('value', $(el).attr('label'))
									.css('color','black');
							}							
						}

						var value = $('input[id=' + id + ']').parent().parent().attr('value');
						var valuelast = $('input[id=' + id + ']').parent().parent().attr('valuelast');

						log("dropdowns.ac.blur(): value = " + value)
						log("dropdowns.ac.blur(): valuelast = " + valuelast);

						if (typeof(value) === "undefined" && typeof(valuelast) === "undefined") {
							log("dropdowns.ac.blur(): Both value and valuelast are undefined. Closing " + id + " dropdown.");
							$('input[id=' + id + ']').autocomplete("close");
							reset(this);
							return;
						}
						if (value === valuelast) {
							//log("dropdowns.ac.blur(): val and valuelast for "
							//				+ id  + " are identical. Setting value to "
							//				+ value + " and triggering close.");
							log("dropdowns.ac.blur(): value and valuelast for "
											+ id  + " are identical. No action taken.");
							$('input[id=' + id + ']').autocomplete("close");
							//reset(this);
						} else {
							log("dropdowns.ac.blur(): value and valuelast are different."
										+ " Closing, setting value to " 
										+ value + " and then triggering select.");
							$('input[id=' + id + ']')
										.autocomplete("close")
										.val(value)
										.data("autocomplete")
										._trigger("select",event,{item:value});
						}	
					});
				},
				close: function(event, ui) {
					// Triggered when drop-down list disappears.
					var id = $(this).attr('id');
					log("dropdowns.ac.close(): Close event on drop-down with id = " + id + ".");
					showvalues(id, ui);
					var valuelast = $('input[id=' + id + ']').parent().parent().attr('valuelast');
					var value = $('input[id=' + id + ']').attr('value');
					if (value == "") {
						log("dropdowns.ac.close(): Value is empty. Setting it to valuelast = " + valuelast);
						$('input[id=' + id + ']').attr('value',valuelast);
						$('input[id=' + id + ']').parent().parent().attr('value',valuelast);
					}
				},
				change: function(event, ui) {
					// Triggered when editing value with keyboard, not hitting enter,
					// and then clicking another element.
					//alert("Change")
					console.log("Change")
					id = $(this).attr('id');
					showvalues(id, ui);
					return;

					log("dropdowns.ac.change(): Change event triggered on drop-down with id = " + id + ".");

					var i = parseInt($(this).parent().parent().attr("id").replace(/[a-z]/gi,""));
					$('input[id=' + id + ']').unbind('blur');

					var valuelast = $('input[id=' + id + ']').parent().parent().attr('valuelast');
					
					log("dropdowns.ac.change(): valuelast = " + valuelast);
					if (valuelast === "") {
						//$(after+i).attr('name',id).attr('valuelast',val);
					}

					if (ui.item == null) {
						ui.item = {};
						log("dropdowns.ac.change(): ui.item == null."
							+ " Setting it to "
							+ $('input[id=' + id + ']').parent().parent().attr('value')
							+ " and triggering select.")
						ui.item.value = $('input[id=' + id + ']').parent().parent().attr('value');
						$('input[id=' + id + ']').val(ui.item.value)
							.data("autocomplete")
							._trigger("select",event,{item: ui.item.value});
						
						return;
					}
					
					// This is to deal with the fact that change()
					// is called on a blur event.
					if (ui.item.value !== ui.item.valuelast) {
						log("dropdowns.ac.change(): " + id 
							+ " value has changed. Removing all following drop-downs.");
						for (j = i+1; j < ids.length; j++) {
							$(after + (j)).html('');
							$(after + (j)).attr('value','')
							$(after + (j)).attr('valuelast','')
						}
					} else {
						// This happens after a selection is made and then user
						// clicks outside of drop-down list. Not a true change event.
						// log(event)
						log("dropdowns.ac.change(): " 
							+ id 
							+ " value has not changed. Not removing drop-down with id = " + id + ".");
					}
				},			
				select: function(event, ui) {
					// Triggered when clicking on a drop-down list item or
					// hitting enter after typing.
					id = $(this).attr('id');

					log("dropdowns.ac.select(): Select event triggered on drop-down with id = " + id);
					showvalues(id, ui);

					var label = $('input[id=' + id + ']').attr('label');
					var value = ui.item.value || event.target.value;
					var valuelast = $('input[id=' + id + ']').parent().parent().attr('valuelast');

					var i = parseInt($(this)
										.parent()
										.parent()
										.attr("id")
										.replace(/[a-z]/gi,""));

					var p = $(this).parent().parent();

					if (typeof(ui.item) === "undefined") {
						log("dropdowns.ac.select(): ui.item is undefined. "
							+ "Setting valuelast to " 
							+ $('input[id=' + id + ']').parent().parent().attr('valuelast'));
						var valuelast = $('input[id=' + id + ']')
										.parent().parent().attr('valuelast');

						if (typeof(valuelast) === "undefined") {
							log("dropdowns.ac.select(): ui.item and valuelast are undefined. Closing " + id + " dropdown.");
							$('input[id=' + id + ']').autocomplete("close");
						}
						return;
					}

					var value = ui.item.value || event.target.value;
					var valuelast = $(p).attr('valuelast');

					log("dropdowns.ac.select(): ui.item.value = " + value)
					log("dropdowns.ac.select(): valuelast = " + valuelast)
					
					log("dropdowns.ac.select(): Setting value to " + value);
					$(p).attr('name',id).attr('value',value);
					
					if (typeof(valuelast) === "undefined") {
						log("dropdowns.ac.select(): Setting valuelast to " + value);
						$(after+i).attr('name',id).attr('valuelast',value);
					}
					$(p).attr('name',id).attr('valuelast',value);

					if (location.hash === "") {
						var qs = {};
					} else {
						log("dropdowns.ac.select(): Getting query object from hash.");
						var qs = parseQueryString();
					}
					var qs = parseQueryString();
					if ($(p).val()) {
						log("dropdowns.ac.select(): Setting query object value for "
							+ $(p).attr('name') + " to " + $(p).val());
						qs[$(p).attr('name')] = $(p).val();
					}
					
					log("dropdowns.ac.select(): Setting hashchange.byurledit to false.");
					$(window).hashchange.byurledit = false;

					log("dropdowns.ac.select(): Setting hash using modified query object.");
					location.hash = decodeURIComponent($.param(qs));

					if (value) {
						log("dropdowns.ac.select(): Setting"
						  + " ui.item.valuelast to ui.item.value.");
						ui.item.valuelast = ui.item.value;
					}

					if (value === valuelast) {
						log("dropdowns.ac.select(): New value was "
										+ "same as old. Closing drop-down"
										+ " and taking no action.");
						$('input[id=' + id + ']').autocomplete("close");
					} else {
						if (funs[i].clearfollowing) {
							if (funs[i].clearfollowing() == false) {
								log("dropdowns.ac.select(): Not clearing values "
											    + "in all drop-downs after " + id + ".");

								if (funs[i].onselect) {
									log("dropdowns.ac.select(): Triggering "
									  + "onselect callback for current drop-down.");
									var err = funs[i].onselect();
								}

								return;
							}
						}

						log("dropdowns.ac.select(): New value is not same as old."
							+ " Clearing values in all drop-downs after " + id + ".");
						
						$("input[id='"+id+"']")
							.parent().parent()
							.nextAll("span")
							.hide()
							.html('')
							.attr('value','');

						log("dropdowns.ac.select(): Getting drop-down "
							+ "values on all remaing drop-downs.");

						qs = {};
						for (j = 0;j < i+1;j++) {
							if ($(after+j).val()) {
								qs[$(after+j).attr('name')] = $(after+j).val();
							}
						}
						log("dropdowns.ac.select(): Setting hash based on"
							+ " values on all remaing drop-downs.");
						location.hash = decodeURIComponent($.param(qs));

						// Trigger onselect callback for dropdowns.
						var err;
						if (funs[i].onselect) {
							log("dropdowns.ac.select(): Triggering "
								+ "onselect callback for current drop-down.");
							var err = funs[i].onselect();
						}

						if (typeof(err) === "string") {
							log("dropdowns.ac.select(): Not setting next drop-down due to error.");								
						} else {
							log("dropdowns.ac.select(): Setting next drop-down.");
							dropdowns(ids, funs, after, i+1);
						}

					}
				},
			}).data("autocomplete")
				._renderMenu = function( ul, items ) {
					let txt = "";
					let title = "";
					if (this.term.length == 0) {
						for (let i = 0; i < items.length; i++) {
							title = "";
							if (items[i].title) {
								title = `title='${items[i].title}'`;
							}
							// Two commented parts are for checkboxes.
							// TODO: Use https://ehynds.github.io/jquery-ui-multiselect-widget/#filter
							txt = txt 
									// + <li style='float:left;background:white'><div style='padding-top:4px'><input type='checkbox'/></div></li>
										+ "<li id='" 
										+ items[i].value 
									// + `' style='padding-left:1.5em' class='ui-menu-item tooltip' ${title} role='presentation'>`
										+ `' class='ui-menu-item tooltip' ${title} role='presentation'>`										+ ""
										+ "<a id='ui-id-" + (i) + "' class='ui-corner-all tooltip' tabindex='-1'>" 
										+ items[i].label
										+ "</a></li>";
						}
					} else {
						var re = new RegExp( "(" + this.term + ")", "gi" );
						cls = "ui-state-highlight";
						template = "<span class='" + cls + "'>$1</span>";
						for (let i = 0; i < items.length; i++) {
							txt = txt + "<li id='" 
										+ items[i].value 
										+ `' class='ui-menu-item tooltip' role='presentation'>`
										+ "<a id='ui-id-" + (i) + "' class='ui-corner-all tooltip' tabindex='-1'>" 
										+ items[i].label.replace(re,template)
										+ "</a></li>";
						}
					}
					$(ul).append(txt);
				}

	}

	log("dropdowns(): Calling " + funs[i].name + "() to get drop-down list entries.");

	// Call dropdown function, which generates list then calls cb().
	let list = funs[i](cb);

	function cb(list) {

		log('dropdowns.cb(): Called with list');
		log(list);

		if (typeof(list) === "string") {
			log("dropdowns(): Call resulted in error. Aborting.");
			return;
		}

		if (!list || list.length == 0) {
			log("dropdowns(): Drop-down has no values. Setting next drop-down.");
			dropdowns(ids, funs, after, i+1);
			return;
		}

		log("dropdowns(): Creating drop-down with id = " + ids[i]);
		$(after+(i)).empty();
		$(after+(i)).parent().parent().attr("valuelast","");

		let iclass = "";
		let tip1 = "";
		let tip2 = "";
		var tips = funs[i].tooltips;
		if (tips) {
			iclass = "tooltip";
			if (tips.length > 0) {
				tip1 = tips[0];
				tip2 = tips[1];
			} else {
				tip1 = tip;
				tip2 = tip;
			}
		}

		var label = '-' + (funs[i].label || funs[i].name) + '-';
		$(after+(i))
			.append('<span class="ui-widget list"></span>');
		$(after + (i) + " .ui-widget")
			.append('<input'
						+ ' class="dropdown-input ' + iclass + '"'
						+ ' id="' + ids[i] + '"'
						+ ' label="' + label + '"'
						+ ' title="' + tip1 + '"'
						+ ' value="'+ label + '"/>')
			.append('<span'
						+ ' class="spacer"'
						+ ' style="width:0.5em;display:table-cell"></span>')
			.append('<label'
						+ ' class="dropdown-label ' + iclass + '"'
						+ ' id="' + ids[i] + 'list"'
						+ ' title="' + tip2 + '"'
						+ ' style="cursor:pointer">&#9660;</label>');

		let el = '#' + ids[i]
		$(el).click(() => {
			// Clear value if bounded by hypens
			if ($(el).attr('value').match(/^\-.*\-$/)) {
				//$(el).attr('value','');
			}
		});

		$(after + (i)).attr('valuelast', label);

		log("dropdowns(): Calling dropdowns.ac() for drop-down with id = " + ids[i]);
		ac(i, list);

		log("dropdowns(): Calling dropdowns.settoggle() drop-down with id = " + ids[i]);
		settoggle(i);

		// Allow entries not in list.
		// Append is synchronous, so this won't happen before element is in DOM.
		// TODO: Each drop-down should have a function validate() that checks if
		// manually entry is valid.
		$(after + (i) + ' input[id=' + ids[i] + ']')
			.live('input',
				function () {
					$(this)
						.parent()
						.parent()
						.attr('value', $(this).attr('value'));
				});

		$('input[id=' + ids[i] + ']').keypress(function(e) {
			log( "dropdowns(): Handler for .keypress() called.");
			var value = $(this).parent().parent().attr('value');
			if(e.keyCode == 13) { 
				// Return
				log("dropdowns(): Triggering keyCode " + e.keyCode);
				$('input[id=' + ids[i] + ']')
					.val(value).data("autocomplete")
					._trigger("select", event, {item: value});
			}
			if (e.keyCode == 9) {
				// TAB
				log("dropdowns(): TAB Pressed.");
				//e.preventDefault();
				//$('input[id=' + ids[i+1] + ']').click();
			}
		});

		if (list.length > 0) {
			log("dropdowns.ac.select(): Drop-down with id = "
					+ ids[i] + " has values. Triggering show on it.");
			$(after+(i)).show();
		} 

		// Look for reasons to automatically select an item.
		if (list.length == 1) {
			log("dropdowns(): Triggering select on drop-down with id = " 
					+ ids[i] + " because it has only one item.");
			$('input[id=' + ids[i] + ']')
				.val(list[0].value).data("autocomplete")
				._trigger("select", event, {item: list[0].value});

			if (i == 0) {
				log("dropdowns.ac.select(): First drop-down with id = "
						+ ids[i] + " has only one value. Hiding it.");
				$(after+(i)).hide();
			}
		}

		if (list.length > 1) {
			// Select first item with attribute selected=true.
			for (var k = 0;k < list.length; k++) {
				if (list[k].selected == true) {
					log("dropdowns(): Triggering select on drop-down with id = " 
							+ ids[i] + " because it has selected=true.");
					$('input[id=' + ids[i] + ']')
						.val(list[k].value).data("autocomplete")
						._trigger("select", event, {item: list[k].value});
					break;
				}
			}
		}
	}
}