const html = {}

html.aLink = function (url, text) {
  let classStr = ''
  if (typeof url !== 'string') {
    console.error(`html.aLink(): Invalid link URL: '${url}'`)
    classStr = 'class="invalid"'
  }
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//') && !url.startsWith('mailto')) {
    url = window.location.origin + window.location.pathname + url
  }
  const title = url.replace('&param', '&amp;param')
  text = text || decodeURIComponent(title).replace('&param', '&amp;param')
  return `<a target="_blank" ${classStr} title="${title}" href="${url}">${text}</a>`
}

html.mailtoLink = function (name, addr, subj) {
  if (!name) {
    name = ''
  }
  if (name.trim() !== '') {
    name = name + ' '
  }
  if (addr.trim().startsWith('http')) {
    return `<a target="_blank" title="${addr}" href="${addr}">${addr}</a>`
  }
  return name + '&lt;' + html.aLink('mailto:' + addr + '?subject=' + subj, addr) + '&gt;'
}

html.downloadLink = function (url, what, element) {
  // Create a "Download X" link.
  const a = html.aLink(url, 'Download ' + what)
  $(element).empty().append(`<span>${a}</span>`).show()
}

html.showJSONOnClick = function (id, url, listID) {
  const idjson = id + 'json'
  const showLink = `<a id="${idjson}" title='${url}'>HAPI JSON for ${id}</a>`
  $(listID + ' > ul').append('<li>' + showLink + '</li>')

  $('#' + idjson).off('click', '**')
  function setClick () {
    $('#' + idjson).click(() => {
      document.getElementById('json-details').scrollIntoView()
      $('#output details').attr('open', false)
      $('#json-details').show().attr('open', true)
      get({ url, dataType: 'json' }, (err, data) => {
        if (err) {
          // Response will be from cache, so don't need to catch.
        }
        $('#json').width($('#infodiv').width() - 15).height($(window).height() / 2)
        $('#output').show()
        $('#json').text(JSON.stringify(data, null, 2))
        hljs.highlightBlock(document.getElementById('json'))
        html.downloadLink(url, `JSON for dataset <code>${id}</code>`, '#json-downloadlink')
      })
    })
  }

  setClick()
  // Used to need (function(url) {setClick(url)})(url). Why no longer needed?
}

html.scrollIntoView = function (id) {
  const element = document.getElementById(id)
  if (!element) return
  try {
    // Not standard. Seee
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
    // TODO: Use polyfill?
    element.scrollIntoViewIfNeeded()
  } catch {
    element.scrollIntoView()
  }
}
