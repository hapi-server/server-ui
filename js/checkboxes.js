function checkboxes(OPTIONS) {

  function savedefaults() {
    const state = {};
    $('input[type="checkbox"]').map(function() {
      state[this.id] = this.checked;
    });
    state["plotserver"] = $('#plotserver').val();
    localStorage.setItem("server-ui-defaults", JSON.stringify(state));
  }

  let defaults = localStorage.getItem("server-ui-defaults");

  if (defaults) {
    defaults = JSON.parse(defaults);
  } else {
    defaults = {
                  showdata: true,
                  showverifierlink: false,
                  showtiming: true,
                  showrequests: false,
                  useimagecache: true, 
                  usedatacache: true,
                  console: false,
                  plotserver: OPTIONS['plotserver']
              }
  }

  savedefaults();

  // TODO: Similar code.

  $('#showdata').attr('checked', defaults['showdata']);
  //if (defaults['showdata']) {}
  $('#showdata').change(function() {
    savedefaults();
    if (this.checked) {
      output();
      $('#data-details').show();
    } else {
      $('#data-details').hide();
    }
  });

  $('#showrequests').attr('checked', defaults['showrequests']);
  if (defaults['showrequests']) {$('#requests').show()}
  $('#showrequests').change(function() {
    savedefaults();
    if (this.checked) {
      $('#requests').show();
    } else {
      $('#requests').hide();
    }
  }).trigger('change');

  $('#showtiming').attr('checked', defaults['showtiming']);
  if (defaults['showtiming']) {$('#timing').show();}
  $('#showtiming').change(function() {
    savedefaults();
    if (this.checked) {
      $('#timing').show();
    } else {
      $('#timing').hide();
    }
  }).trigger('change');

  $('#showstatuslink').attr('checked', defaults['showstatuslink']);
  $('#showstatuslink').change(function() {
    savedefaults();
    if (this.checked) {
      $('#statuslink').show();
    } else {
      $('#statuslink').hide();
    }
  }).trigger('change');

  $('#showverifierlink').attr('checked', defaults['showverifierlink']);
  $('#showverifierlink').change(function() {
    savedefaults();
    if (this.checked) {
      $('#verifierlink').show();
    } else {
      $('#verifierlink').hide();
    }
  }).trigger('change');

  $('#showtestdatalink').attr('checked', defaults['showtestdatalink']);
  $('#showtestdatalink').change(function() {
    savedefaults();
    location.reload();
    if (this.checked) {
      $('#testdatalink').show();
    } else {
      $('#testdatalink').hide();
    }
  }); // Cannot trigger change b/c reload creates infinite loop.

  $('#useimagecache').attr('checked', defaults['useimagecache']);
  $('#useimagecache').change(function() {
    savedefaults();
    let url = $("#image > img").attr('src');
    if (!url) return;
    if (this.checked) {
      if (!/usecache=true/.test(url)) {
        url = url.replace("usecache=false","usecache=true");
        $("#image > img").attr('src',url)
      }
    } else {
      if (!/usecache=false/.test(url)) {
        url = url.replace("usecache=true","usecache=false");
        $("#image > img").attr('src',url)
      }
    }
  }).trigger('change');

  $('#usedatacache').attr('checked', defaults['usedatacache']);
  $('#usedatacache').change(function() { 
    savedefaults();
    let url = $("#image > img").attr('src');
    if (!url) return;
    if (this.checked) {
      if (!/usedatacache=true/.test(url)) {
        url = url.replace("usedatacache=false","usedatacache=true");
        $("#image > img").attr('src',url)
      }
    } else {
      if (!/usedatacache=false/.test(url)) {
        url = url.replace("usedatacache=true","usedatacache=false");
        $("#image > img").attr('src',url)
      }
    }
  }).trigger('change');

  $('#console').attr('checked', defaults['console']);
  $('#console').change(function() {
    savedefaults();
  }).trigger('change');

  $('#plotserver').val(defaults['plotserver']);
  $('#plotserver').change(function () {
    // TODO: Validate
    let qs = parseQueryString();
    if (qs["return"] && qs["return"] === "image" && qs["format"]) {
      // Need to clear all following drop-downs.
      $("input[id='return']")
        .parent().parent()
        .nextAll("span")
        .hide()
        .html('')
        .attr('value','');

        util.log("plotserver changed. Triggering select event on #return drop-down.");
        // Clear first so next trigger causes update.
        $("#return").val("").data("autocomplete")._trigger("select",null,{item: ""});
        $("#return").val("image").data("autocomplete")._trigger("select",null,{item: "image"});
    }
    qs['plotserver'] = $('#plotserver').val();
    $(window).hashchange.byurledit = false;
    location.hash = decodeURIComponent($.param(qs));
    savedefaults();
  });

}