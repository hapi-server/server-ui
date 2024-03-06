function dropdowns(ids, funs, after, i) {

  if (i === undefined) {
    addDestroyMethod();
    handleHTMLInSearch();
		// Destroy all drop-downs.
    $('.dropdown').destroy();
    $('.ui-autocomplete').remove();
    i = 0;
    $(document).on('keydown', (evt) => {
      if (evt.key == "Escape") {
        console.log("dropdowns(): Escape key pressed on document. Closing all open dropdowns.");
        if ($("input[lastevent='open']").length > 0) {
          $("input[lastevent='open']").data("autocomplete")._close();
        } else {
          console.log("dropdowns(): No open dropdowns found.");
        }
      }
    });
  }

  if (i === ids.length) {
    util.log("dropdowns(): Last drop-down already set. Returning.");
    return;
  }

  util.log("dropdowns(): Calling " + funs[i].name + "() to get drop-down list entries.");

  // Call dropdown function, which generates list then calls cb().
  funs[i](cb);

	function cb(list, autoOpen) {

    util.log('dropdowns.cb(): Called with list');
    util.log(list);

    if (typeof(list) === "string") {
      util.log("dropdowns(): Call resulted in error. Aborting.");
      return;
    }

    if (!list || list.length == 0) {
      util.log("dropdowns(): Drop-down has no values. Setting next drop-down.");
      dropdowns(ids, funs, after, i+1);
      return;
    }

    util.log("dropdowns(): Creating drop-down with id = " + ids[i]);
    $(after+(i)).empty();

    let iclass = "";
    let tip1 = "";
    let tip2 = "";
    let tips = funs[i].tooltips;
    if (tips) {
      iclass = "tooltip";
      if (tips.length > 0) {
        tip1 = tips[0];
        tip2 = tips[1];
      }
    }

    let label = '-' + (funs[i].label || funs[i].name) + '-';
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
      // Clear value if bounded by hyphens (so is the label).
      if ($(el).attr('value').match(/^\-.*\-$/)) {
        $(el).attr('value','');
      }
    })

    util.log(`dropdowns.cb(): Setting valuelast to label = ${label} on drop-down with id = '${ids[i]}'`);
    $(after + (i)).attr('valuelast', label);

    util.log(`dropdowns.cb(): Calling dropdowns.ac() for drop-down with id = '${ids[i]}'`);
    ac(i, list);

    util.log(`dropdowns.cb(): Calling dropdowns.setShowListClick() for drop-down with id = '${ids[i]}'`);
    setShowListClick(i);

    // Allow entries not in list.
    // Append is synchronous, so this won't happen before element is in DOM.
    // TODO: Each drop-down should have a function validate() that checks if
    // manual entry is valid.
    $(after + (i) + ' input[id=' + ids[i] + ']')
      .live('input',
        function () {
          $(this).attr('value', $(this).attr('value'));
        });

    $('input[id=' + ids[i] + ']').keypress(function(e) {
      util.log("dropdowns.cb.keypress(): Event handler for .keypress() called.");
      var value = $(this).attr('value');
      if(e.keyCode == 13) {
        // Return key
        let msg = `dropdowns.cb.keypress(): Enter key pressed. select event. `;
        util.log(msg + `Triggering select with item value = ${value}`);
        $('input[id=' + ids[i] + ']')
          .val(value).data("autocomplete")
          ._trigger("select", event, {item: value});
      }
      if (e.keyCode == 9) {
        // TAB
        util.log("dropdowns.cb.keypress(): Tab key pressed. Taking no action.");
        //e.preventDefault();
        //$('input[id=' + ids[i+1] + ']').click();
      }
    });

    if (list.length > 0) {
      util.log(`dropdowns.cb(): '${ids[i]}' drop-down has values. Showing it.`);
      $(after+(i)).show();
    }

    // Look for reasons to automatically select an item.
    if (list.length === 1) {
      util.log(`dropdowns.cb(): Triggering select on '${ids[i]}' drop-down because it has only one item.`);
      $('input[id=' + ids[i] + ']')
        .val(list[0].value)
        .data("autocomplete")
        ._trigger("select", null, {item: list[0].value});

      if (i === 0) {
				// This will prevent entry of a value that is not in the list, however.
				// May want to have option to not hide it.
				util.log(`dropdowns.cb(): First drop-down ('${ids[i]}') has only one item. Hiding it.`);
        $(after+(i)).hide();
      }
    }

    if (list.length > 1) {
      // Select first item with attribute selected=true.
      for (let k = 0; k < list.length; k++) {
        if (list[k].selected == true) {
          util.log(`dropdowns.cb(): '${ids[i]}' dropdown has a value with selected = true. Triggering select on it.`) ;
          $('input[id=' + ids[i] + ']')
            .val(list[k].value)
            .data("autocomplete")
            ._trigger("select", null, {item: list[k].value});
          break;
        }
      }
    }

    if (autoOpen) {
			util.log(`dropdowns.cb(): '${ids[i]}' drop-down called with open = true. Opening it.`);
      $(`input[id='${ids[i]}'`).data("autocomplete").search("");
    }

  }

  function ac(i, list) {

    let opts = {
      source: list,
      scroll: true,
      minLength: 0,
      html: true,
      selectMultiple: funs[i].selectMultiple,
      open: open,
      close: close,
      change: change,
      select: select
    };
    let acObj = $("#" + ids[i]).autocomplete(opts);

    let acData = acObj.data("autocomplete");
    setRenderMenu(acData, list);

    if (funs[i].selectMultiple === true) {
      util.log("dropdowns.ac.open(): Not binding blur event on input[id='" + ids[i] + "'] b/c selectMultiple = true.");
      return;
    }

    util.log("dropdowns.ac.open(): Binding blur event on input[id='" + ids[i] + "'].");
    $(acData.element[0]).blur(function (event, ui) {
      // Triggered when clicking anywhere outside of the <input> element.
      // Here we want to catch case where nothing is selected and show
      // the label again.
      let id = $(this).attr('id');
      util.log("dropdowns.ac.blur(): Blur event triggered on input[id='" + id + "'].");
      printValues(id, event, ui);
      util.log("dropdowns.ac.blur(): Closing menu using close().");
      resetLabel(this, event, ui);
      // Can't call close() function below directly, because it is called after close.
      // So we call _close(), which calls close().
      $(this).data("autocomplete")._close();
    });

    function resetLabel(el, event, ui) {
      let id = $(el).attr('id');
      util.log("dropdowns.ac.resetLabel(): Called for drop-down with id = " + id + ".");
      if ($(el).val() === "") {
        util.log("dropdowns.ac.resetLabel(): No value in input.");
        if (funs[i].selectMultiple) {
          util.log("dropdowns.ac.resetLabel(): selectMultiple = true. Not resetting label.");
          return;
        }
        let valuelast = $(el).attr('valuelast')
        if (valuelast !== undefined) {
          util.log("dropdowns.ac.resetLabel(): valuelast is defined. Setting value to valuelast = " + valuelast);
          $(el).attr('value', valuelast);
        } else {
          let label = $(el).attr('label');
          util.log("dropdowns.ac.resetLabel(): value last is undefined. Setting value to label = " + label);
          $(el).attr('value',label);
        }
      }
    }

    function open(event, ui) {
      // Triggered when list is shown or modified
      $(this).attr('lastevent','open');
      let id = $(this).attr('id');
      util.log(`dropdowns.ac.open(): Open event on id = '${id}'`);
      printValues(id, event, ui);
    }

    function close(event, ui) {
      console.log(event)
      // Triggered when drop-down list disappears.
      $(this).attr('lastevent','open');
      let id = $(this).attr('id');
      util.log(`dropdowns.ac.close(): Close event on drop-down with id = '${id}'`);
      resetLabel(this, event, ui);
    }

    function change(event, ui) {
      // Triggered when editing value with keyboard, not hitting enter,
      // and then clicking another element.
      $(this).attr('lastevent','change');
      let id = $(this).attr('id');

      util.log(`dropdowns.ac.change(): Change event triggered on drop-down with id = '${id}'`);
      printValues(id, event, ui);

      let i = parseInt($(this).attr("id").replace(/[a-z]/gi,""));
      util.log(`dropdowns.ac.change(): Unbinding blur listener on '${id}'.`);
      $('input[id=' + id + ']').unbind('blur');

      let valuelast = $('input[id=' + id + ']').attr('valuelast');
      util.log(`dropdowns.ac.change(): ${id} has valuelast = '${valuelast}'.`);
      if (valuelast === "") {
        //$(after+i).attr('name',id).attr('valuelast',val);
      }

      if (ui.item === null) {
        ui.item = {};
        let value = $('input[id=' + id + ']').attr('value');
        util.log(`dropdowns.ac.change(): ui.item == null. Setting it to value = '${value}' and triggering select.`)
        ui.item.value = value;
        $('input[id=' + id + ']')
          .val(ui.item.value)
          .data("autocomplete")
          ._trigger("select",event,{item: ui.item.value});
      } else if (ui.item.value !== ui.item.valuelast) {
        util.log(`dropdowns.ac.change(): ui.item.value !== ui.item.valuelast. Removing all drop-downs after ${id}`);
        for (let j = i+1; j < ids.length; j++) {
          $(after + (j)).html('');
          $(after + (j)).attr('value','')
          $(after + (j)).attr('valuelast','')
        }
      } else {
        // This happens after a selection is made and then user clicks 
        // outside of drop-down list. Not a true change event.
        util.log(`dropdowns.ac.change(): ${id} value has not changed. Not removing it.`);
      }
      util.log(`dropdowns.ac.change(): Finished processing change event on ${id}.`);
    }

    function select(event, ui) {
      // Triggered when clicking on a drop-down list item or pressing enter 
      // after typing.
      let id = $(this).attr('id');
      $(this).attr('lastevent','select');

      util.log(`dropdowns.ac.select(): Select event triggered on drop-down with id = '${id}'.`);
      printValues(id, event, ui);

      // ui.item.value is the value selected from the list.
      // event.target.value is the value in the input field after hitting enter.
      //let value = ui ? ui.item && ui.item.value || event.target.value : "";
      let value = ui.item.value || event.target.value;
      let valuelast = $(this).attr('valuelast');

      util.log(`dropdowns.ac.select(): Setting input.val('${value}').`);
      $(this).val(value);

      let i = parseInt($(this).parent().parent().attr("id").replace(/[a-z]/gi,""));
      if (funs[i].allowEmptyValue !== true && value === "") {
        let msg = "dropdowns.ac.select(): value = '' and allowEmptyValue !== true.";
        util.log(msg +`Setting to valuelast = '${valuelast}', closing, and returning.`);
        $('input[id=' + id + ']').attr('value', valuelast);
        $('input[id=' + id + ']').autocomplete("close");
        return;
      }

      util.log(`dropdowns.ac.select(): Setting valuelast = '${value}'.`);
      $(this).attr('valuelast',value);

      if (value === valuelast) {
        let msg = "dropdowns.ac.select(): New value is same as old. Closing drop-down and taking no action.";
        util.log(msg);
        $(this).autocomplete("close");
        return;
      }

      if (funs[i].clearFollowing === false) {
        let msg = "dropdowns.ac.select(): clearFollowing = false. ";
        util.log(msg + `Not clearing values in all drop-downs after '${id}'.`);
        util.log(`dropdowns.ac.select(): Modifying hash to have new value.`);
      } else {
        let msg = "dropdowns.ac.select(): New value is not same as old clearFollowing != false.";
        util.log(msg + ` Clearing values in all drop-downs after '${id}'`);
        $(this).parent().parent().nextAll("span").hide().html('').attr('value','');
        util.log(`dropdowns.ac.select(): Creating hash based on drop-downs left after clearing.`);
      }

      let qsNew = {};
      $('input.dropdown-input').each(
        (idx, el) => {
          let ival = $(el).val();
          if ($(el).attr('label') !== ival) {
            qsNew[$(el).attr('id')] = ival;
          }
      });
      util.log(`dropdowns.ac.select(): Setting hash.`);
      hash.update(qsNew, false);

      // Trigger onselect callback for dropdowns.
      let err;
      if (funs[i].onselect) {
        util.log(`dropdowns.ac.select(): Triggering onselect callback for current drop-down '${id}'.`);
        err = funs[i].onselect();
      }

      if (typeof(err) === "string") {
        util.log(`dropdowns.ac.select(): Not setting next drop-down due to error: ${err}`);
      } else {
        if (funs[i].clearFollowing === true) {
          let msg = `dropdowns.ac.select(): `
          util.log(msg + `Setting drop-down after '${id}' b/c clearFollowing = false.`);
          dropdowns(ids, funs, after, i+1);
        } else if ($(after + (i+1)).find('input').length === 0) {
          let msg = `dropdowns.ac.select(): `;
          util.log(msg + `Setting drop-down after '${id}' b/c it does not exist.`);
          dropdowns(ids, funs, after, i+1);
        } else {
          let msg = `dropdowns.ac.select(): Not setting drop-down after '${id}' `;
          util.log(msg + `b/c clearFollowing = false and next drop-down exists.`);
        }
      }
    }

  }

  function printValues(id, event, ui) {

    let value     = $('input[id=' + id + ']').attr('value');
    let valuelast = $('input[id=' + id + ']').attr('valuelast');

    util.log(`	input.val()        = '${$('input[id=' + id + ']').val()}'`);
    if (value === undefined) {
      util.log(`	value attribute    = ${value}`);
    } else {
      util.log(`	value attribute    = '${value}'`);
    }
    if (valuelast === undefined) {
      util.log(`	valuelast          = ${valuelast}`);
    } else {
      util.log(`	valuelast          = '${valuelast}'`);
    }

    if (!event) {
      util.log(`	event              = ${event}`);
    } else if (!event.target) {
      util.log(`	event.target       = ${event.target}`);
    } else if (event.target.value === undefined){
      util.log(`	event.target.value = ${event.target.value}`);
    } else {
      util.log(`	event.target.value = '${event.target.value}'`);
    }

    if (!ui) {
      util.log(`	ui                 = ${ui}`);
    } else if (ui.item === undefined) {
      util.log(`	ui.item            = ${ui.item}`);
    } else {
      if (ui.item.value === undefined) {
        util.log(`	ui.item.value      = ${ui.item.value}`);
      } else {
        util.log(`	ui.item.value      = '${ui.item.value}'`);
      }
      if (ui.item.valuelast === undefined) {
        util.log(`	ui.item.valuelast  = ${ui.item.valuelast}`);
      } else {
        util.log(`	ui.item.valuelast  = '${ui.item.valuelast}'`);
      }
    }
  }

  function setShowListClick(i) {

    // Set event when clicking button that reveals list.
    // Clear search value and show list.
    $("#"+ids[i]+"list").unbind('click');
    util.log("dropdowns.setShowListClick(): Setting click event on '#" + ids[i] + "list' button.");
    $("#" + ids[i] + "list").
      click(function () {
        // Note that search event is not defined.
        let msg;
        msg = "dropdowns.setShowListClick.click(): Click event triggered on " + ids[i] + "list button.";
        util.log(msg);
        msg  = "dropdowns.setShowListClick.click(): Removing text from ";
        msg += ids[i] + "list entry area and binding AJAX search event.";
        util.log(msg);
        $("#" + ids[i])
            .attr('valuelast', $("#" + ids[i]).attr('value'))
            .attr('value','')
            .css('color','black')
            .autocomplete('search')
            .focus();
      });
  }

  function addDestroyMethod() {
    if ($.fn.destroy) return;
    util.log("dropdowns(): Adding destroy() to jQuery.");
    (function( $ ) {
      // http://www.boduch.ca/2013/09/how-to-properly-destroy-jquery-ui.html
      $.fn.destroy = function() {
          return this.each( function( i, element ) {
              $.each( $( element ).data(), function( i, data ) {
                  if ( $.isFunction( data.destroy ) ) {
                      data.destroy();
                  }
              });
          });
      }
      })( jQuery );
  }

  function handleHTMLInSearch() {
    // To fix the issue of html showing up in search, use source and Scott
    // González's extension at https://api.jqueryui.com/autocomplete/#option-source

    /*
    * jQuery UI Autocomplete HTML Extension
    *
    * Copyright 2010, Scott González (http://scottgonzalez.com)
    * Dual licensed under the MIT or GPL Version 2 licenses.
    *
    * http://github.com/scottgonzalez/jquery-ui-extensions
    */
    (function( $ ) {

      var proto = $.ui.autocomplete.prototype,
        initSource = proto._initSource;

      function filter( array, term ) {
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
        return $.grep( array, function (value) {
          let match = false;
          if (value.label) {
            match = matcher.test( $( "<div>" ).html(value.label).text() );
          }
          if (value.value) {
            match = match || matcher.test( $( "<div>" ).html(value.value).text() );
          }
          return match;
        });
      }

      $.extend( proto, {
        _initSource: function() {
          if ( this.options.html && $.isArray(this.options.source) ) {
            this.source = function( request, response ) {
              response( filter( this.options.source, request.term ) );
            };
          } else {
            initSource.call( this );
          }
        },

        _renderItem: function( ul, item) {
          return $( "<li></li>" )
            .data( "item.autocomplete", item )
            .append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
            .appendTo( ul );
        }
        });

    })( jQuery );
  }

  function setRenderMenu(acData, list) {

    // See https://gist.github.com/evdokimovm/08f34089f0d032f2d7364fc1de9d70da
    // for allowing shift select of checkboxes.
    acData._renderMenu = function(ul, items) {
      let role ='presentation';
      let liHTML = "";
      let selectMultiple = this.options.selectMultiple;
      let isSearchResult = this.term.length > 0;
      if (this.term) {
        // If search term is not empty, manually add first two list items.
        items = [...list.slice(0,2),...items];
      }

      console.log("dropdowns.setRenderMenu._renderMenu(): Creating ul list");
      for (let i = 0; i < items.length; i++) {

        let title = items[i].title ? `title='${items[i].title}'`: "";
        let label = items[i].label || items[i].value;
        let valueText = items[i].value;
        let valueHTML = valueText;

        let valueLen = valueText.length;
        let class_ = "class='ui-menu-item'";
        if (valueLen < 70) {
          if (valueLen + label.length > 80) {
            label = label.slice(0, 80 - valueLen) + "...";
            class_ = "class='ui-menu-item tooltip'";
          }
        } else {
          label = "";
          class_ = "class='ui-menu-item tooltip'";
        }
        if (title === label) {
          title = "";
        }

        if (isSearchResult) {
          // If there was a search result, highlight.
          let re = new RegExp( "(" + this.term + ")", "gi" );
          let template = "<span class='ui-state-highlight'>$1</span>";
          label = label.replace(re,template);
          valueHTML = valueText.replace(re,template);
        }

        let labelHTML = `<span class='id'>${label}</span>`;
        if (label !== valueText && valueText !== "") {
          labelHTML = `<span class='id'>${valueHTML}</span>: <span>${label}</span>`;
        }

        if (selectMultiple) {
          labelHTML = checkboxLabelHTML(i, valueText, labelHTML);
          liHTML += `<li ${class_} ${title} ${role}>${labelHTML}</li>\n`;
        } else {
          let aHTML = `<a class='ui-corner-all' tabindex='-1'>${labelHTML}</a>`;
          liHTML += `<li id="${valueText}" ${class_} ${title} ${role}>${aHTML}</li>\n`;
        }
      }

      console.log("dropdowns.setRenderMenu._renderMenu(): Created ul list");
      console.log("dropdowns.setRenderMenu._renderMenu(): Setting ul list");
      $(ul).append(liHTML);
      console.log("dropdowns.setRenderMenu._renderMenu(): Set ul list");
      console.log("dropdowns.setRenderMenu._renderMenu(): Setting ul list data on each li");

      $(ul).find('li').each(function(idx, el) {
        // Set click event on SPAN and INPUT elements.
        if (selectMultiple) setCheckboxClick(el, ul, isSearchResult);
        // The following is needed for search to work. Probably would be faster
        // if we could set as a data-* attribute. See https://api.jquery.com/data/.
        $(this).data( "ui-autocomplete-item", {value: this.id});
      });

      if (selectMultiple) setCheckboxFinished(ul, isSearchResult);
      console.log("dropdowns.setRenderMenu._renderMenu(): Set ul list data on each li");
    }

    function checkboxLabelHTML(i, valueText, labelHTML) {

      let selectedParameters = selected('parameters');
      let selectAll = false;
      if (query.parseQueryString()['parameters'] !== undefined && selectedParameters === "") {
        selectAll = true;
      }
      if (i === 0) {
        console.log(`dropdowns.setRenderMenu.checkboxLabelHTML(): selectAll = ${selectAll}`);
      }

      let checked = "";
      let disabled = "";
      let class_ = "";
      if (selectAll) {
        checked = "checked";
      }
      if (i === 0) {
        class_ = "class='select-all'"
      }
      if (i === 1) {
        class_ = "class='primary-time'"
        checked = "checked";
        disabled = "disabled"
      }
      if (i > 1 && selectedParameters.split(",").includes(valueText)) {
        checked = "checked";
      }
      let inputHTML = `<input id='${valueText}' type='checkbox' ${class_} ${checked} ${disabled}>`;
      return `<label class='dropdown-checkbox'>${inputHTML}${labelHTML}</label>`;
    }

    function setCheckboxFinished(ul, isSearchResult) {
      console.log("dropdowns.setRenderMenu.setCheckboxFinished(): Setting finished event on ul list.");
      $(ul).one('mouseenter', function () {
        console.log("dropdowns.setRenderMenu.setCheckboxFinished(): mouseenter event on ul list.");
      });
      $(ul).one('mouseleave', function () {
        console.log("dropdowns.setRenderMenu.setCheckboxFinished(): mouseleave event on ul list. Closing list.");
        setCheckboxValues(ul, isSearchResult);
        let input = $(acData.element[0]);
        $(input).data("autocomplete")._close();
        $(input).data("autocomplete")._trigger("select", null, {item: input.val()});
      });
    }

    function setCheckboxClick(el, ul, isSearchResult) {

      $(el).click(function(event) {

        let target = event.target;
        if (target.tagName !== "INPUT") {
          // Click event set on label element, which has INPUT and SPAN.
          // so two events alway fired. This prevents the second event.
          return;
        }

        if ($(target).hasClass('select-all')) {
          if ($(target).prop('checked')) {
            console.log("dropdowns.setRenderMenu.setCheckboxClick(): Select all was clicked to be checked");
            $(ul).find('input').prop('checked', true);
          } else {
            console.log("dropdowns.setRenderMenu.setCheckboxClick(): Select all was clicked to be unchecked");
            $(ul).find('input:not(.primary-time)').prop('checked', false);
          }
        }

        let nChecked = $(ul).find('input:checked:not(.select-all)').length;
        let nCheckboxes = $(ul).find('input:not(.select-all)').length;
        if (nChecked === nCheckboxes) {
          $(ul).find("input.select-all").prop('checked', true);
        } else {
          $(ul).find("input.select-all").prop('checked', false);
        }

        setCheckboxValues(ul, isSearchResult);
      });
    }

    function setCheckboxValues(ul, isSearchResult) {

      let input = $(acData.element[0]);
      if ($("input.select-all").prop('checked') && !isSearchResult) {
        console.log("dropdowns.setRenderMenu.setCheckboxClick(): Select all is checked. Setting value to ''.");
        input.val("");
        input.attr("value", "");
        return;
      }

      let parameters = [];
      $(ul).find('input:checked:not(.select-all):not(.primary-time)').each(function (idx, el) {
        console.log(el)
        parameters.push($(el).attr("id"));
      });

      if (parameters.length === 0) {
        console.log("dropdowns.setRenderMenu.setCheckboxValues(): Nothing selected. Setting value to .primary-time value.");
        input.val($(ul).find('input').eq(1).attr('id'));
        input.attr("value", $(ul).find('input').eq(1).attr('id'));
        return;
      }

      console.log(`dropdowns.setRenderMenu.setCheckboxValues(): Setting value of input to '${parameters}'`);
      input.val(parameters);
      input.attr("value", parameters);
    }
  }
}