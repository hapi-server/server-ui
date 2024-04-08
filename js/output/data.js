function data () {
  const selectedParameters = selected('parameters')

  const parameterString = '&parameters=' + selectedParameters

  let url = servers.info[selected('server')].url +
              '/data?id=' + selected('dataset') +
              parameterString +
              '&time.min=' + selected('start') +
              '&time.max=' + selected('stop')

  url = util.hapi2to3(url)

  let getOptions = {}
  if (selected('format') === 'csv') {
    getOptions = { dataType: 'text', chunk: true }
  }
  if (selected('format') === 'json') {
    url = url + '&format=json'
    getOptions = { dataType: 'json', chunk: false }
  }
  if (selected('style') === 'header') {
    url = url + '&include=header'
  }

  html.downloadLink(url, 'data', '#data-downloadlink')

  if ($('#showdata').prop('checked') === false) {
    return
  }

  $('#data').empty()
  $('#data').width($('#infodiv').width() - 15).height($(window).height() / 2)
  $('#data-records-and-size').empty()

  // html.scrollIntoView("data-details");
  $('#output details').attr('open', false)
  $('#data-details').show().attr('open', true)

  util.log('output(): Getting ' + url)

  $('#dataRequestError').empty().hide()
  getOptions = {
    url,
    requestURLElement: '#dataRequestURL',
    timeout: window.HAPIUI.options.dataTimeout,
    timer: {
      element: '#dataRequestTiming'
    },
    ...getOptions
  }

  get({ url, timer: { element: '#dataRequestTiming' }, ...getOptions },
    function (err, data, length, nRecords) {
      if (err) {
        const msg = `Error when requesting ${html.aLink(url, 'data')}: ${err}.`
        $('#dataRequestError').html(msg).show()
        $('#data-details').attr('open', false)
        // cb(err, url);
        return
      }
      if (getOptions.chunk === false) {
        if (getOptions.dataType === 'text') {
          $('#data').append(data)
        } else {
          $('#data').append(JSON.stringify(data, null, 2))
        }
      } else {
        if (selected('style') === 'header') {
          const datas = $('#data').val().trim().split('\n')
          let i
          for (i = 0; i < datas.length; i++) {
            if (!datas[i].startsWith('#')) {
              break
            }
          }
          nRecords = datas.length - i
        }
      }
      const msg = `(${nRecords} records, ${util.bytesWithSIUnits(length)})`
      $('#data-records-and-size').empty().text(msg)
      $('#data').show()
    })
}
