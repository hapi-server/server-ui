let hash = {};

hash.update = function(qs, byurledit) {
  let hash = decodeURIComponent($.param(qs));
  util.log(`hash.update(): byurledit = ${byurledit}.`);
  util.log(`hash.update(): Modifying hash from\n  ${location.hash}\nto\n  ${hash}.`);
  $(window).hashchange.byurledit = byurledit;
  location.hash = hash;
  util.postHashChange(window.location.hash);
};

hash.hashchange = function () {
  // Monitor hash for changes via text entry in address bar.

  window.lastHash = window.location.hash;

  // Update drop-downs when URL is changed manually.
  util.log("hashchange(): Binding hashchange.");
  $(window).hashchange.byurledit = true;
  $(window).hashchange.ignore = false;

  $(window).bind("hashchange", function(event) {

    util.log("hashchange.bind.hashchange(): Called.");

    if (window.location.hash === window.lastHash) {
      // hashchange seems to be triggered when clicking an element with an onclick tag.
      util.log("hashchange.bind.hashchange(): Hash did not change. Ignoring.");
      return;
    }

    if (window.location.hash.startsWith("#?")) {
      // This is needed for testing.
      event.preventDefault();
      window.location.hash = window.lastHash;
      return;
      // This will occur if a link such as "?server=..." is clicked.
      // Such links are used in testing. The hash is modified to be valid
      // and we assume* the API query has an equivalent fragment query.
      // *TODO: This won't always be the case.
      util.log("hashchange.bind.hashchange(): Click resulted in hash to start with '#?':");
      util.log("hashchange.bind.hashchange():   " + window.location.hash);
      util.log("hashchange.bind.hashchange(): Assuming server query has equivalent UI query and setting above hash after removing '?'.");
      event.preventDefault();
      location.hash = window.location.hash.replace("#?", "#");
      return;
    }

    window.lastHash = window.location.hash;

    // Need to figure out what parameter was changed and then
    // remove all parameters after that. Otherwise user could
    // change the server and the parameter list will not be
    // updated.
    let qs = query.parseQueryString();
    let changed = {};
    for (let id in qs) {
      let val = $('#' + id).val();
      util.log("hashchange.bind.hashchange(): Value in query string = " + qs[id] + ". Value in drop-down = " + val);
      if (qs[id] !== val) {
        changed[id] = true;
        //util.log('hashchange.bind.hashchange(): Query string value differs from that in ' + id + " dropdown.");
      } else {
        //util.log('hashchange.bind.hashchange(): Query string value same as that in ' + id + " dropdown.");
      }
    }

    let nChanged = Object.keys(changed).length;

    if (nChanged > 1 || 'server' in changed) {
      if (nChanged > 1) {
        util.log(`hashchange.bind.hashchange(): More than one query string value changed. Resetting app. byurledit = ${$(window).hashchange.byurledit}`);
      } else {
        util.log('hashchange.bind.hashchange(): Server changed. Resetting app.');
      }
      main();
      return;
    } else if (nChanged === 1) {
      util.log(`hashchange.bind.hashchange(): One query string value changed. byurledit = ${$(window).hashchange.byurledit}`);
    } else {
      util.log(`hashchange.bind.hashchange(): No query string value changed. byurledit = ${$(window).hashchange.byurledit}`);
    }

    if (nChanged > 0 && $(window).hashchange.byurledit) {
      util.log("hashchange.bind.hashchange(): Hash change made by manual edit of one non-server parameter.");
      util.log("hashchange.bind.hashchange(): Current hash: " + location.hash);

      for (let id in changed) {
        util.log("hashchange.bind.hashchange(): Setting " + id + " drop-down to " + qs[id] + " and triggering change.");
        $("#" + id).val(qs[id])
            .data("autocomplete")
            ._trigger("select",null,{item: qs[id]});
        }
    }
    $(window).hashchange.byurledit = true;
  });
};