function dropdowns(ids, names, funs, tips, after, i, callback) {

	var console = {}; console.log = function(){};
	
	if (arguments.length < 6) {
		i = 0;
	}

	if (i == ids.length) {
		console.log("dropdowns(): Last drop-down already set. Returning.");
		return;
	}

	function settoggle(i) {

		$("#"+ids[i]+"list").unbind('click');
		console.log("dropdowns.settoggle(): Setting click event on "
					+ ids[i] + "list element.");
		$("#" + ids[i] + "list").
			click(function () {
				// Note that search event is not defined.
				console.log("dropdowns.settoggle.click(): Removing text from "
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
		
	function ac(i, list) {	
		$("#" + ids[i])
			.autocomplete({
				source: list,
				scroll: true,
				open: function (event, ui) {

					var id = $(this).attr('id');
					console.log("dropdowns.ac.open(): Open event on " + id + ".");
					console.log("dropdowns.ac.open(): Binding blur event on id = " + id);
					$('input[id=' + id + ']').blur(function () {
						function reset(el) {
							console.log("dropdowns.ac.reset(): Called.");
							if (!$(el).attr('value')) {
								console.log("dropdowns.ac.reset(): Resetting to " + '-' + names[i] + '-');
								$("#"+id)
									.attr('value', '-' + names[i] + '-')
									.css('color','black');
							}							
						}
 						id = $(this).attr('id')
						console.log("dropdowns.ac.blur(): Blur event triggered on id = " + id + ".");
						var value = $('input[id=' + id + ']')
										.parent().parent().attr('value');
						var valuelast = $('input[id=' + id + ']')
										.parent().parent().attr('valuelast');
						console.log("dropdowns.ac.blur(): value = " + value)
						console.log("dropdowns.ac.blur(): valuelast = " + valuelast);

						if (typeof(value) === "undefined" && typeof(valuelast) === "undefined") {
							console.log("dropdowns.ac.blur(): Both value and valuelast are undefined. Closing " + id + " dropdown.");
							$('input[id=' + id + ']').autocomplete("close");
							reset(this);
							return;
						}
						if (value === valuelast) {
							//console.log("dropdowns.ac.blur(): val and valuelast for "
							//				+ id  + " are identical. Setting value to "
							//				+ value + " and triggering close.");
							console.log("dropdowns.ac.blur(): value and valuelast for "
											+ id  + " are identical. No action taken.");
							$('input[id=' + id + ']').autocomplete("close");
							//reset(this);
						} else {
							console.log("dropdowns.ac.blur(): value and valuelast are different."
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
				minLength: 0,
				close: function(event,ui) {
					// If no value is set, use the default definition.
					var id = $(this).attr('id');
					console.log("dropdowns.ac.close(): Close event on drop-down with id = " + id + ".");
				},
				change: function(event, ui) {
					var id = $(this).attr('id');
					console.log("dropdowns.ac.change(): Change event triggered on drop-down with id = " + id + ".");

					var i = parseInt($(this)
								.parent().parent()
								.attr("id").replace(/[a-z]/gi,""));
					
					$('input[id=' + id + ']').unbind('blur');

					var valuelast = $('input[id=' + id + ']')
						.parent().parent().attr('valuelast');
					
					console.log("dropdowns.ac.change(): valuelast = " + valuelast);
					if (valuelast === "") {
						//$(after+i).attr('name',id).attr('valuelast',val);
					}

					if (ui.item == null) {
						ui.item = {};
						console.log("dropdowns.ac.change(): ui.item == null."
							+ " Setting it to "
							+ $('input[id=' + id + ']')
									.parent().parent()
									.attr('value')
							+ " and triggering select.")
						ui.item.value = $('input[id=' + id + ']')
											.parent().parent().attr('value');
						$('input[id=' + id + ']').val(ui.item.value)
							.data("autocomplete")
							._trigger("select",event,{item:ui.item.value});
						
						return;
					}
					
					// This is to deal with the fact that change()
					// is called on a blur event.
					if (ui.item.value !== ui.item.valuelast) {
						console.log("dropdowns.ac.change(): " + id 
							+ " value has changed. Removing all following drop-downs.");
						for (j = i+1; j < ids.length; j++) {
							$(after + (j)).html('');
							$(after + (j)).attr('value','')
							$(after + (j)).attr('valuelast','')
						}
					} else {
						// This happens after a selection is made and then user
						// clicks outside of drop-down list. Not a true change event.
						// console.log(event)
						console.log("dropdowns.ac.change(): " 
							+ id 
							+ " value has not changed. Not removing drop-down with id = " + id + ".");
					}
				},			
				select: function(event, ui) {

					id = $(this).attr('id');

					console.log("dropdowns.ac.select(): Select event triggered on drop-down with id = " + id);

					var i = parseInt($(this)
										.parent()
										.parent()
										.attr("id")
										.replace(/[a-z]/gi,""));

					var p = $(this).parent().parent();

					if (typeof(ui.item) === "undefined") {
						console.log("dropdowns.ac.select(): ui.item is undefined. "
							+ "Setting valuelast to " 
							+ $('input[id=' + id + ']').parent().parent().attr('valuelast'));
						var valuelast = $('input[id=' + id + ']')
										.parent().parent().attr('valuelast');

						if (typeof(valuelast) === "undefined") {
							console.log("dropdowns.ac.select(): ui.item and valuelast are undefined. Closing " + id + " dropdown.");
							$('input[id=' + id + ']').autocomplete("close");
						}
						return;
					}

					var value = ui.item.value || event.target.value;
					
					var valuelast = $(p).attr('valuelast');

					console.log("dropdowns.ac.select(): ui.item.value = " + value)
					console.log("dropdowns.ac.select(): valuelast = " + valuelast)
					
					console.log("dropdowns.ac.select(): Setting value to " + value);
					$(p).attr('name',id).attr('value',value);
					
					if (typeof(valuelast) === "undefined") {
						console.log("dropdowns.ac.select(): Setting valuelast to " + value);
						$(after+i).attr('name',id).attr('valuelast',value);
					}
					$(p).attr('name',id).attr('valuelast',value);

					if (location.hash === "") {
						var qs = {};
					} else {
						console.log("dropdowns.ac.select(): Getting query object from hash.");
						var qs = parseQueryString();
					}
					var qs = parseQueryString();
					if ($(p).val()) {
						console.log("dropdowns.ac.select(): Setting query object value for "
										+ $(p).attr('name') + " to " + $(p).val());
						qs[$(p).attr('name')] = $(p).val();
					}
					
					console.log("dropdowns.ac.select(): Setting hashchange.byurledit to false.");
					$(window).hashchange.byurledit = false;

					console.log("dropdowns.ac.select(): Setting hash using modified query object.");
					location.hash = decodeURIComponent($.param(qs));

					if (value) {
						console.log("dropdowns.ac.select(): Setting"
									+ " ui.item.valuelast to ui.item.value.");
						ui.item.valuelast = ui.item.value;
					}

					if (value === valuelast) {
						console.log("dropdowns.ac.select(): New value was "
										+ "same as old. Closing drop-down"
										+ " and taking no action.");
						$('input[id=' + id + ']').autocomplete("close");
					} else {
						if (funs[i].clearfollowing) {
							if (funs[i].clearfollowing() == false) {
								console.log("dropdowns.ac.select(): Not clearing values "
											+ "in all drop-downs after " + id + ".");
								return;
							}
						}

						console.log("dropdowns.ac.select(): New value is not same as old."
									+ " Clearing values in all drop-downs after " + id + ".");
						

						$("input[id='"+id+"']")
							.parent().parent()
							.nextAll("span")
							.hide().html('')
							.attr('value','')
							.attr('valuelast','');

						console.log("dropdowns.ac.select(): Getting drop-down "
									+ "values on all remaing drop-downs.");
						qs = {};
						for (j = 0;j < i+1;j++) {
							if ($(after+j).val()) {
								qs[$(after+j).attr('name')] = $(after+j).val();
							}
						}
						console.log("dropdowns.ac.select(): Setting hash based on"
										+ " values on all remaing drop-downs.");
						location.hash = decodeURIComponent($.param(qs));

						// Trigger onselect callback for dropdowns.
						var err;
						if (funs[i].onselect) {
							console.log("dropdowns.ac.select(): Triggering "
											+ "onselect callback for current drop-down.");
							var err = funs[i].onselect();
						}

						if (typeof(err) === "string") {
							console.log("dropdowns.ac.select(): Not setting next drop-down due to error.");								
						} else {
							console.log("dropdowns.ac.select(): Setting next drop-down.");
							dropdowns(ids, names, funs, tips, after, i+1);
						}

					}
				}
			})
	}

	console.log("dropdowns(): Calling " 
					+ funs[i].toString().split("{")[0].trim() 
					+ " to get drop-down list entries.");

	let list = funs[i](cb);

	function cb(list) {

		console.log('dropdowns.cb(): Called with list');
		console.log(list);

		if (typeof(list) === "string") {
			console.log("dropdowns(): Call resulted in error. Aborting.");
			return;
		}

		if (!list) {
			console.log("dropdowns(): Drop-down has no values. Setting next drop-down.");
			dropdowns(ids, names, funs, tips, after, i+1);
			return;
		}

		if (list.length == 0) {
			console.log("dropdowns(): Drop-down has no values. Setting next drop-down.");
			dropdowns(ids, names, funs, tips, after, i+1);
			return;
		}

		console.log("dropdowns(): Creating drop-down with id = " + ids[i]);

		$(after+(i)).empty();
		$(after+(i)).parent().parent().attr("valuelast","");
		$(after+(i))
			.append('<span class="ui-widget list"></span>');

		let iclass = "";
		let tip1 = "";
		let tip2 = "";
		if (tips.length > 0 && tips[i].length > 0) {
			iclass = "tooltip";
			tip1 = tips[i][0];
			tip2 = tips[i][1];
		}
		$(after + (i) + " .ui-widget")
			.append('<input'
						+ ' class="dropdown-input ' + iclass + '"'
						+ ' id="' + ids[i] + '"'
						+ ' title="' + tip1 + '"'
						+ ' value="-'+ names[i] +'-"/>')
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
				$(el).attr('value','');
			}
		});

		console.log("dropdowns(): Calling dropdowns.ac() for drop-down with id = " + ids[i]);
		ac(i, list);

		console.log("dropdowns(): Calling dropdowns.settoggle() drop-down with id = " + ids[i]);
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
			  	console.log( "dropdowns(): Handler for .keypress() called." );
			    var value = $(this).parent().parent().attr('value');
			    if(e.keyCode == 13) { // Return
			    	console.log("dropdowns(): Triggering keyCode " + e.keyCode);
			    	$('input[id=' + ids[i] + ']')
			    		.val(value).data("autocomplete")
			    		._trigger("select", event, {item: value});
			    }
			    if (e.keyCode == 9) { // TAB
			    	console.log("dropdowns(): TAB Pressed.")
			    	//e.preventDefault();
			    	//$('input[id=' + ids[i+1] + ']').click();
			    }
		});


		if (list.length > 0) {
			console.log("dropdowns.ac.select(): Drop-down with id = "
						+ ids[i] + " has values. Triggering show on it.");
			$(after+(i)).show();
		} 

		// Look for reasons to automatically select an item.
		if (list.length == 1) {
			console.log("dropdowns(): Triggering select on drop-down with id = " 
						+ ids[i] + " because it has only one item.");
			$('input[id=' + ids[i] + ']')
				.val(list[0].value).data("autocomplete")
				._trigger("select", event, {item: list[0].value});

			if (i == 0) {
				console.log("dropdowns.ac.select(): First drop-down with id = "
							+ ids[i] + " has only one value. Hiding it.");
				$(after+(i)).hide();
			}
		}

		if (list.length > 1) {
			// Select first item with attribute selected=true.
			for (var k = 0;k < list.length; k++) {
				if (list[k].selected) {
					console.log("dropdowns(): Triggering select on drop-down with id = " 
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