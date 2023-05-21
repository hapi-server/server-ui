// Monitor hash for changes via text entry in address bar.
function hashchange() {

  // Update drop-downs when URL is changed manually.
  log("hashchange(): Binding hashchange.");
  $(window).hashchange.byurledit = true;

  $(window).bind("hashchange", function() {

    $('#xstatus').empty();
    // Need to figure out what parameter was changed and then
    // remove all parameters after that. Otherwise user could
    // change the server and the parameter list will not be
    // updated.
    log("hashchange(): Hash change; by url edit = "
        + $(window).hashchange.byurledit);
    var qs = parseQueryString();

    let Nchanged = 0;
    for (var id in qs) {
      log("hashchange(): Value in query string = " + qs[id]);
      var val = $('#' + id).parent().parent().attr('value');
      log("hashchange(): Drop-down value  = " + val);
      if (qs[id] !== val) {
        Nchanged = Nchanged + 1;
        log('hashchange(): Query string value differs from that in ' + id + " dropdown.");
      } else {
        log('hashchange(): Query string value same as that in ' + id + " dropdown.");           
      }
    }

    if (Nchanged > 1) {
      log('hashchange(): More than one query string value changed. Resetting app.');
      $(window).unbind("hashchange");
      location.reload();
      return;
    } else {                        
      log('hashchange(): No query string value changed.');
    }

    if ($(window).hashchange.byurledit) {
      log("hashchange(): Hash change made by manual edit of one parameter.");
      log("hashchange(): Last hash: " + location.hash);

      for (var id in qs) {
        if (id === "plotserver") {
          continue; // Handled in checkboxes.js.
        }
        log("hashchange(): Setting " + id + " drop-down to " + qs[id] + " and triggering change.");
        // This does not work in jquery-ui 1.12.1
        if (id == 'servers' && !servers.ids.includes(qs[id]) && !server_list_in_hash()) {
          $('#xstatus').append("<span style='background-color:yellow'>Server with id=" + qs[id] + " is not available from this interface.</span>");
          $(window).hashchange.byurledit = false;
          setTimeout(() => {
            window.location.hash = "";
            $(window).hashchange.byurledit = true;
          },2000);
          break;
        }
        $("#" + id).val(qs[id])
            .data("autocomplete")
            ._trigger("select",null,{item: qs[id]});
        }
    }                   
    $(window).hashchange.byurledit = true;
  }); 
}