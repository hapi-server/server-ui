function checkboxes() {

  function savedefaults() {
    var state = {};
    var values = $('input[type="checkbox"]').map(function() {
        state[this.id] = this.checked;
    })
    localStorage.setItem("server-ui-defaults", JSON.stringify(state));
  }

  let defaults = localStorage.getItem("server-ui-defaults");

  if (defaults) {
    defaults = JSON.parse(defaults);
  } else {
    defaults = {
                  showdata: true,
                  showverifierlink: false,
                  showtiming: false,
                  useimagecache: true, 
                  usedatacache: true,
                  console: false,
                  plotserver: "http://hapi-server.org/plot"
              }
  }

  $('#showrequests').attr('checked', defaults['showrequests']);
  $('#showrequests').change(function() {
    savedefaults();
    if (this.checked) {
      $('#loading').show();
    } else {
      $('#loading').hide();
    }
  })

  $('#showtiming').attr('checked', defaults['showtiming']);
  $('#showtiming').change(function() {
    savedefaults();
    if (this.checked) {
      $('#timing').show();
    } else {
      $('#timing').hide();
    }
  })

  $('#showstatuslink').attr('checked', defaults['showstatuslink']);
  $('#showstatuslink').change(function() {
    savedefaults();
    if (this.checked) {
      $('#statuslink').show();
    } else {
      $('#statuslink').hide();
    }
  })

  $('#showverifierlink').attr('checked', defaults['showverifierlink']);
  $('#showverifierlink').change(function() {
    savedefaults();
    if (this.checked) {
      $('#verifierlink').show();
    } else {
      $('#verifierlink').hide();
    }
  })

  $('#showtestdatalink').attr('checked', defaults['showtestdatalink']);
  $('#showtestdatalink').change(function() {
    savedefaults();
    location.reload();
    if (this.checked) {
      $('#testdatalink').show();
    } else {
      $('#testdatalink').hide();
    }
  })

  $('#showdata').attr('checked', defaults['showdata']);
  $('#showdata').change(function() {
    savedefaults();
    if (this.checked) {
      output();
    } else {
      $('#data').remove();
    }
  })

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
  })

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
  })

  $('#console').attr('checked', defaults['console']);
  $('#console').change(function() {
    savedefaults();
  });

}