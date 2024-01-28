// Monitor hash for changes via text entry in address bar.
function hashchange() {

  // Update drop-downs when URL is changed manually.
  util.log("hashchange(): Binding hashchange.");
  $(window).hashchange.byurledit = true;

  $(window).bind("hashchange", function() {

    // Need to figure out what parameter was changed and then
    // remove all parameters after that. Otherwise user could
    // change the server and the parameter list will not be
    // updated.
    util.log("hashchange.bind(): Called.");
    let qs = parseQueryString();

    let changed = {};
    for (let id in qs) {
      util.log("hashchange.bind(): Value in query string = " + qs[id]);
      let val = $('#' + id).parent().parent().attr('value');
      util.log("hashchange.bind(): Value in drop-down = " + val);
      if (qs[id] !== val) {
        changed[id] = true;
        util.log('hashchange.bind(): Query string value differs from that in ' + id + " dropdown.");
      } else {
        util.log('hashchange.bind(): Query string value same as that in ' + id + " dropdown.");
      }
    }

    let nChanged = Object.keys(changed).length;
    if (nChanged > 1 || 'server' in changed) {
      if (nChanged > 1) {
        util.log('hashchange.bind(): More than one query string value changed. Resetting app.');
      } else {
        util.log('hashchange.bind(): Server changed. Resetting app.');
      }
      $(window).unbind("hashchange");
      location.reload();
      return;
    } else if (nChanged === 1) {
      util.log('hashchange.bind(): One query string value changed.');
    } else {
      util.log('hashchange.bind(): No query string value changed.');
    }

    if ($(window).hashchange.byurledit) {
      util.log("hashchange(): Hash change made by manual edit of one non-server parameter.");
      util.log("hashchange(): Current hash: " + location.hash);

      for (let id in qs) {
        if (id === "plotserver") {
          continue; // Handled in checkboxes.js.
        }
        util.log("hashchange(): Setting " + id + " drop-down to " + qs[id] + " and triggering change.");
        $("#" + id).val(qs[id])
            .data("autocomplete")
            ._trigger("select",null,{item: qs[id]});
        }
    }
  });
}