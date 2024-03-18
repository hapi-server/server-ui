function dropdowns(funs, wrapper, i) {

  if (i === undefined) {
    i = 0;
    addDestroyMethod();
    // Destroy all dropdowns.
    $('.dropdown').destroy();
    $('.ui-autocomplete').remove();
    handleHTMLInSearch();
    bindCloseEvents()
  }

  if (i === funs.length) {
    util.log("dropdowns(): Last dropdown already set. Returning.");
    return;
  }

  util.log(`dropdowns(): Calling ${funs[i].name}() to get dropdown list entries.`);

  // Call dropdown function, which generates list then calls cb() with a menu list.
  //setTimeout(() => funs[i](cb), 1000); // To simulate slow response.
  let timeoutId = setTimeout(() => {
    $("#dropdowns" + (i)).text("Fetching content ...").show()
  }, 300);

  funs[i](cb)

  function bindCloseEvents() {

    function closeAll() {
      let input = $("input[lastevent='open']"); // Should be only one.
      if (input.length > 1) {
        console.error("dropdowns.bindCloseEvents(): More than one open dropdown found. This should not happen. Closing first only.");
      }
      if (input.length > 0) {
        input.first().data("autocomplete")._close();
          //input.first().data("autocomplete")._trigger("select", undefined, {item: input.val()});
      } else {
        console.log("dropdowns.bindCloseEvents(): No open open dropdowns found.");
      }

      let einput = $('input[value=""].dropdown-input');
      if (einput.length > 1) {
        console.error("dropdowns.bindCloseEvents(): More than one input with empty value found. This should not happen. Closing first only.");
      }
      if (einput.length > 0) {
        console.error("dropdowns.bindCloseEvents(): Input with empty value found. Closing it so label is reset.");
        einput.first().data("autocomplete")._trigger("close");
      }
    }

    $(document).unbind('click');
    $(document).click(function (event) {
      console.log("dropdowns.bindCloseEvents(): Document click event.");
      if ($(event.target).parents(".ui-widget").length > 0) {
        console.log("dropdowns.bindCloseEvents(): Clicked element has ancestor with class 'ui-input'. Not closing dropdowns.");
        return;
      }
      console.log("dropdowns.bindCloseEvents(): Clicked element does not have ancestor with class 'ui-input'. Closing dropdowns.");
      closeAll();
    });

    $(document).on('keydown', (evt) => {
      if (evt.key == "Escape") {
        console.log("dropdowns.bindCloseEvents(): Escape key pressed on document. Closing all open dropdowns.");
        closeAll();
      }
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

	function cb(list, autoOpen) {

    clearTimeout(timeoutId);

    util.log('dropdowns.cb(): Called with list');
    util.log(list);

    if (typeof(list) === "string") {
      util.log("dropdowns(): Call resulted in error. Aborting.");
      return;
    }

    if (!list || list.length == 0) {
      util.log("dropdowns(): Dropdown has no values. Setting next dropdown.");
      dropdowns(funs, wrapper, i+1);
      return;
    }

    let id = funs[i].id;

    util.log(`dropdowns(): Creating dropdown with id = '${id}'.`);
    $(wrapper+(i)).empty();

    let iclass = "";
    let tip1 = "";
    let tips = funs[i].tooltips;
    if (tips) {
      iclass = "tooltip";
      if (tips.length > 0) {
        tip1 = tips[0];
      }
    }

    let label = '-' + (funs[i].label || funs[i].name) + '-';
    let elId = `dropdowns${i}`
    $(wrapper)
      .append(`<span id="${elId}" class="dropdown"></span>`);
    $(`#${elId}`)
      .append('<span class="ui-widget list"></span>');
    $(`#${elId} .ui-widget`)
        .append('<span'
          + ' class="dropdown-list ' + iclass + '"'
          + ' id="' + id + '-list"'
          + ' style="cursor:pointer">▶</span>')
        .append('<input'
            + ' class="dropdown-input ' + iclass + '"'
            + ' id="' + id + '"'
            + ' label="' + label + '"'
            + ' title="' + tip1 + '"'
            + ' value="'+ label + '"/>')


    let input = 'input[id=' + id + ']';

    util.log(`dropdowns.cb(): Setting up autocomplete and events on ${input}.`);
    setAutocomplete(i, list);

    util.log(`dropdowns.cb(): Binding events on ${input}.`);
    bindEvents(id, input);

    if (list.length === 0) {
      // Error.
    }

    if (list.length > 0) {
      util.log(`dropdowns.cb(): '${id}' dropdown has values. Showing it.`);
      $(wrapper+(i)).show();
    }

    // Look for reasons to automatically select an item.
    if (list.length === 1) {
      util.log(`dropdowns.cb(): Triggering select on '${id}' dropdown because it has only one item.`);
      $(input)
        .val(list[0].value)
        .data("autocomplete")
        ._trigger("select", undefined, {item: list[0].value});

      if (i === 0) {
				// This will prevent entry of a value that is not in the list, however.
				// May want to have option to not hide it.
				//util.log(`dropdowns.cb(): First dropdown ('${id}') has only one item. Hiding it.`);
        //$(wrapper+(i)).hide();
      }
    }

    if (list.length > 1) {
      // Select first item with attribute selected=true.
      let selected = [];
      for (let k = 0; k < list.length; k++) {
        if (list[k].selected == true) {
          selected.push(list[k].value);
        }
      }
      if (selected.length > 0) {
        if (selected.length == 1) {
          util.log(`dropdowns.cb(): '${id}' dropdown has an item with selected = true. Triggering select on it.`) ;
        } else {
          util.log(`dropdowns.cb(): '${id}' dropdown has ${selected.length} items with selected = true. Triggering select on them.`) ;
        }
        $(input)
          .val(selected.join(","))
          .data("autocomplete")
          ._trigger("select", undefined, {item: selected.join(",")});
      } else {
        util.log(`dropdowns.cb(): '${id}' dropdown has no items with selected = true.`) ;
      }
  }

    if (autoOpen) {
			util.log(`dropdowns.cb(): '${id}' dropdown called with open = true. Opening it.`);
      $(input).data("autocomplete").search("");
    }

    function bindEvents(id, input) {

      $(input).click((evt) => {
        // Clear value if bounded by hyphens (so is the label).
        if ($(evt.target).attr('value').match(/^\-.*\-$/)) {
          $(evt.target).attr('value','');
        }
      })

      util.log(`dropdowns.cb(): Binding keypress event on ${input} to trigger select event when enter key pressed.`);
      $(input).keypress(function(e) {
        util.log("dropdowns.cb.keypress(): Event handler for .keypress() called.");
        var value = $(e.target).attr('value');
        if(e.keyCode == 13) {
          // Return key
          let msg = `dropdowns.cb.keypress(): Enter key pressed. select event. `;
          util.log(msg + `Triggering select with item value = ${value}`);
          $(input)
            .val(value).data("autocomplete")
            ._trigger("select", event, {item: value});
            $(input).data("autocomplete")._close();
          }
        if (e.keyCode == 9) {
          // TAB
        }
      });
    }

    function setAutocomplete(i, list) {

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

      let id = funs[i].id;
      let acObj = $(`#${id}`).autocomplete(opts);

      let acData = acObj.data("autocomplete");
      setRenderMenu(acData, list);

      // Remove the default blur event. jQuery UI's autocomplete triggers a
      // close event on blur, but when clicking on a list open button is a 
      // blur event, and we don't want to close the list in that case.
      $(acData.element[0]).unbind('blur');

      if (!setAutocomplete[id]) {
        setAutocomplete[id] = {"open": false};
      }

      let listId = id + "-list";
      $("#"+listId).unbind('click');
      $("#"+listId).click(function (event) {
        console.log(`dropdowns.setAutocomplete(): Click on element with id '${$(event.target).attr('id')}'.`);
        if ($(event.target).attr('id') === listId && setAutocomplete[id]["open"] === false) {
          console.log(`dropdowns.setAutocomplete(): '${id}' open = '${setAutocomplete[id]["open"]}'.`);
          $(`#${id}`).attr('value','').css('color','black').autocomplete('search').focus();
          return;
        }
        let input = $(`input[id='${id}']`);
        input.data("autocomplete")._close();
      });

      function resetLabel(el) {
        let id = $(el).attr('id');
        util.log("dropdowns.setAutocomplete.resetLabel(): Called for dropdown with id = " + id + ".");
        if ($(el).val() === "" && funs[i].allowEmptyValue !== true) {
          util.log("dropdowns.setAutocomplete.resetLabel(): No value in input.");
          let valuelast = $(el).attr('valuelast')
          if (valuelast !== undefined) {
            util.log("dropdowns.setAutocomplete.resetLabel(): valuelast is defined. Setting value to valuelast = " + valuelast);
            $(el).attr('value', valuelast);
          } else {
            let label = $(el).attr('label');
            util.log("dropdowns.setAutocomplete.resetLabel(): value last is undefined. Setting value to label = " + label);
            $(el).attr('value',label);
          }
        }
      }

      function open(event, ui) {
        let id = $(this).attr('id');
        setAutocomplete[id]["open"] = true;
        // Triggered when list is shown or modified
        $(this).attr('lastevent','open');
        util.log(`dropdowns.setAutocomplete.open(): Open event on id = '${id}'`);
        printValues(id, event, ui);
        $(`#${id}-list`).html("▼");
      }

      function close(event, ui) {
        // Triggered when dropdown list disappears (when _close() in autocomplete() is called.)
        let id = $(this).attr('id');
        setAutocomplete[id]["open"] = false;
        $(this).attr('lastevent','close');
        util.log(`dropdowns.setAutocomplete.close(): Close event on dropdown with id = '${id}'`);
        resetLabel(this, event, ui);
        $(`#${id}-list`).html("▶");
      }

      function change(event, ui) {
        // Triggered when editing value with keyboard, not hitting enter,
        // and then clicking another element.
        $(this).attr('lastevent','change');
        let id = $(this).attr('id');
        let input = `input[id='${id}']`;
        util.log(`dropdowns.setAutocomplete.change(): Change event triggered on ${input} (event requires no action).`);
        printValues(id, event, ui);
      }

      function select(event, ui) {
        // Triggered when clicking on a dropdown list item or pressing enter
        // after typing.
        let id = $(this).attr('id');
        $(this).attr('lastevent','select');

        util.log(`dropdowns.setAutocomplete.select(): Select event triggered on '${id}' dropdown.`);
        printValues(id, event, ui);

        // ui.item.value is the value selected from the list.
        // event.target.value is the value in the input field after hitting enter.
        let value = ui ? ui.item && ui.item.value || event.target.value : "";
        //let value = ui.item.value || event.target.value;
        let valuelast = $(this).attr('valuelast');

        util.log(`dropdowns.setAutocomplete.select(): Setting input.val('${value}').`);
        $(this).val(value);

        let i = parseInt($(this).parent().parent().attr("id").replace(/[a-z]/gi,""));
        if (funs[i].allowEmptyValue !== true && value === "") {
          let msg = "dropdowns.setAutocomplete.select(): value = '' and allowEmptyValue !== true. ";
          util.log(msg +`Setting to valuelast = '${valuelast}', closing, and returning.`);
          $('input[id=' + id + ']').attr('value', valuelast);
          $('input[id=' + id + ']').autocomplete("close");
          return;
        }

        util.log(`dropdowns.setAutocomplete.select(): Setting valuelast = '${value}'.`);
        $(this).attr('valuelast',value);

        if (value === valuelast) {
          let msg = "dropdowns.setAutocomplete.select(): New value is same as old. Closing dropdown and taking no action.";
          util.log(msg);
          $(this).autocomplete("close");
          return;
        }

        if (funs[i].clearFollowing === false) {
          let msg = "dropdowns.setAutocomplete.select(): clearFollowing = false. ";
          util.log(msg + `Not clearing values in all dropdowns after '${id}'.`);
          util.log(`dropdowns.setAutocomplete.select(): Modifying hash to have new value.`);
        } else {
          let msg = "dropdowns.setAutocomplete.select(): New value is not same as old clearFollowing != false.";
          util.log(msg + ` Clearing values in all dropdowns after '${id}'`);
          $(this).parent().parent().nextAll("span").hide().html('').attr('value','');
          util.log(`dropdowns.setAutocomplete.select(): Creating hash based on dropdowns left after clearing.`);
        }

        let qsNew = {};
        $('input.dropdown-input').each(
          (idx, el) => {
            let ival = $(el).val();
            if ($(el).attr('label') !== ival) {
              qsNew[$(el).attr('id')] = ival;
            }
        });
        util.log(`dropdowns.setAutocomplete.select(): Setting hash.`);
        hash.update(qsNew);

        // Trigger onselect callback for dropdowns.
        let err;
        if (funs[i].onselect) {
          util.log(`dropdowns.setAutocomplete.select(): Triggering onselect callback for current dropdown '${id}'.`);
          err = funs[i].onselect();
        }

        if (typeof(err) === "string") {
          util.log(`dropdowns.setAutocomplete.select(): Not setting next dropdown due to error: ${err}`);
        } else {
          if (funs[i].clearFollowing === true) {
            let msg = `dropdowns.setAutocomplete.select(): `
            util.log(msg + `Setting dropdown after '${id}' b/c clearFollowing = false.`);
            dropdowns(funs, wrapper, i+1);
          } else if ($(wrapper + (i+1)).find('input').length === 0) {
            let msg = `dropdowns.setAutocomplete.select(): `;
            util.log(msg + `Setting dropdown after '${id}' b/c it does not exist.`);
            dropdowns(funs, wrapper, i+1);
          } else {
            let msg = `dropdowns.setAutocomplete.select(): Not setting dropdown after '${id}' `;
            util.log(msg + `b/c clearFollowing = false and next dropdown exists.`);
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
        } else if (ui.item === undefined || ui.item === null) {
          util.log(`	ui.item            = ${ui.item}`);
        } else {
          if (ui.item.value === undefined || ui.item.value === null) {
            util.log(`	ui.item.value      = ${ui.item.value}`);
          } else {
            util.log(`	ui.item.value      = '${ui.item.value}'`);
          }
          if (ui.item.valuelast === undefined || ui.item.value === null) {
            util.log(`	ui.item.valuelast  = ${ui.item.valuelast}`);
          } else {
            util.log(`	ui.item.valuelast  = '${ui.item.valuelast}'`);
          }
        }
      }

      function setRenderMenu(acData, list) {

        // See https://gist.github.com/evdokimovm/08f34089f0d032f2d7364fc1de9d70da
        // for allowing shift select of checkboxes.
        acData._renderMenu = function(ul, items) {
          let role ='presentation';
          let liHTML = "";
          let selectMultiple = this.options.selectMultiple;
          let isSearchResult = this.term.length > 0;
          if (isSearchResult && selectMultiple) {
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
            let tooltip = false;
            if (valueLen < 70) {
              if (valueLen + label.length > 80) {
                label = label.slice(0, 80 - valueLen) + "...";
                tooltip = true;
              }
            } else {
              label = "";
              tooltip = true;
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
              // No class ui-menu-item b/c autocomplete() triggers _close() on click.
              let class_ = `class='${tooltip ? "tooltip" : ""}'`;
              liHTML += `<li ${class_} ${title} ${role}>${labelHTML}</li>\n`;
            } else {
              let aHTML = `<a class='ui-corner-all' tabindex='-1'>${labelHTML}</a>`;
              let class_ = `class='ui-menu-item ${tooltip ? "tooltip" : ""}'`;
              liHTML += `<li id="${valueText}" ${class_} ${title} ${role}>${aHTML}</li>\n`;
            }
          }

          // TODO: For performance, consider using https://clusterize.js.org/ for large lists.
          // Could also cache list HTML for full list. However, most time seems to be in rendering.
          // which would be addressed by clusterize.js.

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
            $(input).data("autocomplete")._trigger("select", undefined, {item: input.val()});
          });

          //bindBlur();
          function bindBlur() {
            // A more standard way to close the list, but the list is typically
            // large enough that a user mouseleave is almost always followed by a
            // click somewhere on the document to close the list. As an alternative,
            // we could set this blur event to only occur after mouseleave.
            $(ul).blur(function () {
              setCheckboxValues(ul, isSearchResult);
              let input = $(acData.element[0]);
              $(input).data("autocomplete")._close();
              $(input).data("autocomplete")._trigger("select", undefined, {item: input.val()});
            });
          }
        }

        function setCheckboxClick(el, ul, isSearchResult) {

          $(el).click(function(event) {

            console.log("dropdowns.setRenderMenu.setCheckboxClick.click(): Click event.");

            let target = event.target;
            if (target.tagName !== "INPUT") {
              // Click event set on label element, which has INPUT and SPAN.
              // so two events alway fired. This prevents the second event.
              console.log("dropdowns.setRenderMenu.setCheckboxClick.click(): Click event not on INPUT element.");
              return;
            }

            console.log("dropdowns.setRenderMenu.setCheckboxClick.click(): Click event on INPUT element.");

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

          console.log("dropdowns.setRenderMenu.setCheckboxValues.setCheckboxClick(): Called.");

          let input = $(acData.element[0]);
          if ($("input.select-all").prop('checked') && !isSearchResult) {
            console.log("dropdowns.setRenderMenu.setCheckboxClick(): Select all is checked. Setting value to ''.");
            input.val('');
            input.attr("value", "");
            return;
          }

          let parameters = [];
          $(ul).find('input:checked:not(.select-all):not(.primary-time)').each(function (idx, el) {
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
  }
}