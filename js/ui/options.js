function options (useDefaults) {
  function savedefaults () {
    const state = {}
    $('input[type="checkbox"]').map(function () {
      state[this.id] = this.checked
    })
    state.plotserver = $('#plotserver').val()
    localStorage.setItem('server-ui-defaults', JSON.stringify(state))
  }

  let defaults = localStorage.getItem('server-ui-defaults')

  if (defaults && useDefaults !== false) {
    defaults = JSON.parse(defaults)
  } else {
    defaults = {
      showdata: true,
      showhelp: true,
      showrequests: true,
      showverifierlink: false,
      showexamplequeries: true,
      showconsolemessages: false,
      showuitests: false,
      showtestdatalink: false,

      useimagecache: true,
      usedatacache: true
    }
  }

  if (defaults.showtiming) {
    defaults.showrequests = true
  }
  savedefaults()

  // TODO: Similar code.

  $('#delete-history').unbind('click')
  $('#delete-history').click(function () {
    localStorage.removeItem('server-ui-last-starts')
    localStorage.removeItem('server-ui-last-stops')
    alert('History cleared.')
    main()
  })

  $('#reset-options').unbind('click')
  $('#reset-options').click(function () {
    checkboxes(false)
  })

  $('#showhelp').attr('checked', defaults.showhelp)
  $('#showhelp')
    .change(function () {
      savedefaults()
      // Help strings for static elements
      if (this.checked) {
        document.documentElement.style.setProperty('--data-tooltip-hover-opacity', 1);
      } else {
        document.documentElement.style.setProperty('--data-tooltip-hover-opacity', 0);
      }
    })
    .trigger('change')

  // Help for dynamically created elements. Strings are stored in hidden
  // divs in #appHelp div.
  $(document)
    .on('mouseenter', '.dropdown-list, .dropdown-input', (evt) => {
      if ($('#showhelp').is(':checked')) {
        let id = $(evt.target).attr('id')
        // Get help text in hidden div.
        let helpText = $("#" + id + "-help").html()
        let root = document.documentElement;
        let delay = getComputedStyle(root).getPropertyValue('--data-tooltip-delay');
        if (delay) {
          if (delay.endsWith('ms')) {
          delay = parseInt(delay.replace('ms', ''), 10) || 0;
          } else {
            delay = parseFloat(delay.replace('s', '')) * 1000;
          }
        } else {
          delay = 0;
        }
        $('#appHelp').html(helpText).delay(delay).show(0)
      }
  })
  $(document)
    .on('mouseleave', '.dropdown-list, .dropdown-input', () => {
      $('#appHelp').stop(true, true)
      $('#appHelp').hide()
  })

  $('#showdata').attr('checked', defaults.showdata)
  // if (defaults['showdata']) {}
  $('#showdata').change(function () {
    savedefaults()
    if (this.checked) {
      output()
      $('#data-details').show()
    } else {
      $('#data-details').hide()
    }
  })

  $('#showexamplequeries').attr('checked', defaults.showexamplequeries)
  $('#showexamplequeries').change(function () {
    savedefaults()
    if (this.checked) {
      $('#all-example-details').show()
    } else {
      $('#all-example-details').hide()
    }
  }).trigger('change')

  $('#showrequests').attr('checked', defaults.showrequests)
  if (defaults.showrequests) { $('.requestInfo').show() }
  $('#showrequests').change(function () {
    savedefaults()
    if (this.checked) {
      $('.requestInfo').show()
    } else {
      $('.requestInfo').hide()
    }
  }).trigger('change')

  $('#showstatuslink').attr('checked', defaults.showstatuslink)
  $('#showstatuslink').change(function () {
    savedefaults()
    if (this.checked) {
      $('#statuslink').show()
    } else {
      $('#statuslink').hide()
    }
  }).trigger('change')

  $('#showverifierlink').attr('checked', defaults.showverifierlink)
  $('#showverifierlink').change(function () {
    savedefaults()
    if (this.checked) {
      $('#verifierlink').show()
    } else {
      $('#verifierlink').hide()
    }
  }).trigger('change')

  $('#showtestdatalink').attr('checked', defaults.showtestdatalink)
  $('#showtestdatalink').change(function () {
    savedefaults()
    main()
    if (this.checked) {
      $('#testdatalink').show()
    } else {
      $('#testdatalink').hide()
    }
  }) // Cannot trigger change b/c reload creates infinite loop.

  $('#useimagecache').attr('checked', defaults.useimagecache)
  $('#useimagecache').change(function () {
    savedefaults()
    let url = $('#image > img').attr('src')
    if (!url) return
    if (this.checked) {
      if (!/usecache=true/.test(url)) {
        url = url.replace('usecache=false', 'usecache=true')
        $('#image > img').attr('src', url)
      }
    } else {
      if (!/usecache=false/.test(url)) {
        url = url.replace('usecache=true', 'usecache=false')
        $('#image > img').attr('src', url)
      }
    }
  }).trigger('change')

  $('#usedatacache').attr('checked', defaults.usedatacache)
  $('#usedatacache').change(function () {
    savedefaults()
    let url = $('#image > img').attr('src')
    if (!url) return
    if (this.checked) {
      if (!/usedatacache=true/.test(url)) {
        url = url.replace('usedatacache=false', 'usedatacache=true')
        $('#image > img').attr('src', url)
      }
    } else {
      if (!/usedatacache=false/.test(url)) {
        url = url.replace('usedatacache=true', 'usedatacache=false')
        $('#image > img').attr('src', url)
      }
    }
  }).trigger('change')

  $('#showconsolemessages').attr('checked', defaults.showconsolemessages)
  $('#showconsolemessages').change(function () {
    savedefaults()
  }).trigger('change')

  $('#showuitests').attr('checked', defaults.showuitests)
  $('#showuitests').change(function () {
    if (this.checked) {
      $('#uitests-details').show()
    } else {
      $('#uitests-details').hide()
    }
    savedefaults()
  }).trigger('change')
}
