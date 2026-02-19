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

html.iconLink = function (url, _class, element) {
  // Create a "Download X" link.
  let msg = ''
  if (_class === 'download') {
    msg = 'Download data'
  }
  if (_class === 'open-in-new-tab') {
    msg = 'Open image in new tab'
  }
  let icon = `<span class="${_class}"></span>`
  let downloadLink = html.aLink(url, icon)
  downloadLink = $(downloadLink)
                    .removeAttr('title')
                    .addClass('icon')
                    .attr('data-tooltip', msg)
  // Not working. Only works for same-origin URLs.
  //downloadLink.attr('download', html.sanitizeFilename(url))
  $(element).empty().append(downloadLink).show()
}

html.aboutList = function (json, url) {
  if (typeof json.contact === 'string') {
    // Default is to show what is in all.txt. This updates based on info
    // in /about response.
    let newContact = 'Server contact: ' + html.mailtoLink(null, json.contact, url)
    $('#servercontact').html(newContact)
  }

  if (json.id) {
    $('#serverinfo > ul').append(`<li>Server ID: <code>${json.id}</code></li>`)
  }

  if (json.title) {
    $('#serverinfo > ul').append(`<li>Server Title: ${json.title}</li>`)
  }

  if (json.description) {
    const li = `<li>Server Description: ${json.description}</li>`
    $('#serverinfo > ul').append(li)
  }

  if (json.resourceID) {
    const li = `<li>Resource ID: ${json.resourceID} (identifier that applies to all datasets)</li>`
    $('#serverinfo > ul').append(li)
  }

  if (json.HAPI) {
    const url = "https://github.com/hapi-server/data-specification/tree/master"
    const li = `<li>HAPI Version: <a href="${url}">${json.HAPI}</a></li>`
    $('#serverinfo > ul').append(li)
  }

  const citation = json.citation || json.serverCitation || null
  if (citation !== null) {
    if (citation.trim().startsWith('http')) {
      const txt = 'Server citation (individual datasets may have their own citations)'
      const citation = html.aLink(citation, txt)
      $('#serverinfo > ul').append('<li>' + citation + '</li>')
    } else {
      $('#serverinfo > ul').append(`<li>Server Citation: ${citation}</li>`)
    }
  }

  $('#serverinfo > ul').append(_noteAndWarningHTML(json))

  html.showJSONOnClick('about', url, '#serverinfo')
}

function _noteAndWarningHTML (json) {
  const fieldsToCheck = ['note', 'warning']
  let html = ""
  for (const field of fieldsToCheck) {
    if (json[field]) {
      let items = ''
      if (typeof json[field] === 'string') {
        items = json[field]
      } else if (Array.isArray(json[field])) {
        for (const item of json[field]) {
          items += `<li>${item}</li>`
        }
        items = `<ul>${items}</ul>`
      }
      const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1)
      html += `<li>${fieldLabel}: ${items}</li>`
    }
  }
  return html
}

html.serverList = function(json, url) {
  const contactEmail = json.contactEmail || ''
  const contactName = json.contactName || ''
  const li1 = '<li>Server URL: <code>' + html.aLink(url) + '</code></li>'
  $('#serverinfo > ul').append(li1)
  if (contactEmail && contactName) {
    const mailtoLink = html.mailtoLink(contactName, contactEmail, url)
    const li2 = `<li id="servercontact">Server Contact: ${mailtoLink}</li>`
    $('#serverinfo > ul').append(li2)
  }
}

html.parametersList = function (json, url) {
  $('#datasetinfo ul').append(`<li>id: <code>${hash.selected('dataset')}</code></li>`)

  let description = json.description
  if (description && /\\n/.test(description)) {
    // Preserve formatting in description.
    description = '<pre>' + description.replace('\\n', '<br/>') + '</pre>'
  }
  if (description) {
    $('#datasetinfo ul').append('<li>Description: ' + description + '</li>')
  }

  // Show number of parameters
  let nParameters = `<code>${json.parameters.length}</code> `
  nParameters += `parameter${util.plural(json.parameters)} from `
  let link = html.aLink(url, '/info?id=' + hash.selected('dataset'))
  nParameters += `<code>${link}</code> response`
  $('#nParameters').html(nParameters)

  $('#datasetinfo ul').append(`<li>Start: <code>${json.startDate}</code></li>`)
  $('#datasetinfo ul').append(`<li>Stop: <code>${json.stopDate}</code></li>`)

  let cadence = json.cadence
  if (cadence) {
    cadence = `Cadence: ${time.ISODuration2Words(cadence)} (<code>${cadence}</code>)`
  } else {
    cadence = 'Cadence: not specified'
  }
  $('#datasetinfo ul').append(`<li>${cadence}</li>`)

  if (json.resourceURL) {
    const link = html.aLink(json.resourceURL, 'Dataset documentation or metadata')
    $('#datasetinfo ul').append(`<li>${link}</li>`)
  }

  if (json.contact) {
    const link = html.mailtoLink(null, json.contact, url)
    $('#datasetinfo ul').append(`<li>Dataset contact: ${link}</li>`)
  }

  $('#datasetinfo ul').append(_noteAndWarningHTML(json))

  html.showJSONOnClick('info', url, '#datasetinfo')

  let surl = servers.info[hash.selected('server')].url
  if (!surl.startsWith('http')) {
    surl = window.location.origin + window.location.pathname + surl
  }
  let vurl = window.HAPIUI.options.verifier +
              '?url=' + surl +
              '&id=' + datasets.info[hash.selected('dataset')].id

  if (hash.selected('server').id !== 'CSA') {
    vurl = util.hapi2to3(vurl)
  }

  link = `<a target="_blank" href="${vurl}">Check this dataset using the HAPI Verifier</a>`
  let warning = ''
  if (new URL(surl).hostname.startsWith('localhost') === true) {
    if (new URL(vurl).hostname.startsWith('localhost') === false) {
      warning = '<br>(Server URL host name is <code>localhost</code> and verifier'
      warning += ' URL host name is not <code>localhost</code>. Verifier links may not work.)'
    }
  }
  const li = `<li id="verifierlink" style="display:none">${link} ${warning}</li>`
  $('#datasetinfo ul').append(li)
}

html.sanitizeFilename = function (filename) {
  return filename.replace('https://','').replace('http://','').replace(/[/\\?%*:|"<>]/g, '-');
}

html.showJSONOnClick = function (id, url, listID) {
  const idjson = id + 'json'
  const showLink = `<a id="${idjson}" title='${url}'>HAPI JSON for <code>/${id}</code> metadata shown above</a>`
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
        const defaultHeight = $(window).height() / 2
        $('#json').width($('#infodiv').width() - 15)
        $('#output').show()
        $('#json').text(JSON.stringify(data, null, 2))
        hljs.highlightBlock(document.getElementById('json'))
        html.iconLink(url, `JSON for dataset <code>${id}</code>`, '#json-downloadlink')

        // Shrink to fit content
        $('#json').css('height', 'auto')
        const jsonElement = document.getElementById('json')
        const jsonStyles = window.getComputedStyle(jsonElement)
        const verticalPadding = (parseFloat(jsonStyles.paddingTop) || 0) +
              (parseFloat(jsonStyles.paddingBottom) || 0)
        const contentHeight = jsonElement.scrollHeight - verticalPadding
        const maxHeight = Math.min(defaultHeight, contentHeight)
        $('#json').height(maxHeight)
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
