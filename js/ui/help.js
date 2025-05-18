function help () {
  const server = `Enter partial text then ⏎ to search or click ▶ to see full list.
  <br>Close list using <code>ESC</code> or by clicking triangle.
  <br>Instructions apply to all drop-downs.`

  const serverList = `Show/hide list
  <ul><li>Constrain list by entering text in input area to right.</li>
  <li>Close list using <code>ESC</code> or by clicking triangle.</li>
  <li>Instructions apply to all lists.</li></ul>`

  const start = `Press ⏎ after entering or modifying text to trigger update.
  <br><br>Start date/time in format (or reduced version):
  <ul>
  <li>YYYY-MM-DDTHH:MM:SS.mmmμμμnnnZ</li>
  <li>YYYY-DOY...</li>
  </ul>`

  const startList = `Default start date/time is <code>startDate</code> in
   <code>/info</code> response.`

  const stop = `Press ⏎ after entering or modifying text to trigger update.
  <br><br>Stop date/time in same format as start. 
  Stop date/times are <b>exclusive</b>.`

  const parametersList = `
  <ul>
  <li>Select from list then move pointer out of selection area or</li>
  <li>enter partial text then ⏎ to search.</li>
  Close using <code>ESC</code> or click triangle.
  </ul>`

  const helpText = {
    '#server': server,
    '#server-list': serverList,
    '#parameters-list': parametersList,
    '#start-list': startList,
    '#start': start,
    '#stop': stop
  }

  for (const [key, value] of Object.entries(helpText)) {
    $(document).on('mouseenter', key, () => {
      if ($('#showhelp').is(':checked')) {
        $('#appHelp').html(value).show()
      }
    })
    $(document).on('mouseleave', key, () => {
      $('#appHelp').hide()
    })
  }
}
