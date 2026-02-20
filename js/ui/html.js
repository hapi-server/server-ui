const html = {

  aLink: function (url, text) {
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
  },

  mailtoLink: function (name, addr, subj) {
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
  },

  iconLink: function (url, _class, element) {
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
  },

  aboutList: function (json, url) {
    if (json.contact) {
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
    const citation = json.citation || json.serverCitation || null
    if (citation !== null) {
      const coda = '(individual datasets may have their own citations)'
      const linked = html._maybeLink(citation, 'Server citation', coda)
      $('#serverinfo > ul').append(`<li>${linked}</li>`)
    }

    if (json.resourceID) {
      const coda = '(identifier that applies to all datasets)'
      const linked = html._maybeLink(json.resourceID, 'Resource ID', coda)
      $('#serverinfo > ul').append(`<li>${linked}</li>`)
    }

    if (json.HAPI) {
      const url = "https://github.com/hapi-server/data-specification/tree/master"
      const li = `<li>HAPI Version: <a href="${url}">${json.HAPI}</a></li>`
      $('#serverinfo > ul').append(li)
    }

    $('#serverinfo > ul').append(html._noteAndWarningHTML(json))

    html.showJSONOnClick('about', url, '#serverinfo')
  },

  serverList: function(json, url) {
    const contactEmail = json.contactEmail || ''
    const contactName = json.contactName || ''
    const li1 = '<li>Server URL: <code>' + html.aLink(url) + '</code></li>'
    $('#serverinfo > ul').append(li1)
    if (contactEmail && contactName) {
      const mailtoLink = html.mailtoLink(contactName, contactEmail, url)
      const li2 = `<li id="servercontact">Server Contact: ${mailtoLink}</li>`
      $('#serverinfo > ul').append(li2)
    }
  },

  parametersList: function (json, url) {
    const datasetList = $('#datasetinfo > ul')

    // Show number of parameters
    let nParameters = `<code>${json.parameters.length}</code> `
    nParameters += `parameter${util.plural(json.parameters)} from `
    let link = html.aLink(url, '/info?id=' + hash.selected('dataset'))
    nParameters += `<code>${link}</code> response`
    $('#nParameters').html(nParameters)

    datasetList.append(`<li>id: <code>${hash.selected('dataset')}</code></li>`)

    let description = json.description
    if (description && /\\n/.test(description)) {
      // Preserve formatting in description.
      description = '<pre>' + description.replace('\\n', '<br/>') + '</pre>'
    }
    if (description) {
      datasetList.append('<li>Description: ' + description + '</li>')
    }

    if (json.resourceURL) {
      let link = html.aLink(json.resourceURL, 'Dataset documentation or metadata')
      datasetList.append(`<li>${link}</li>`)
    }

    if (json.resourceID) {
      const linked = html._maybeLink(json.resourceID, 'Dataset Resource ID', '')
      datasetList.append(`<li>${linked}</li>`)
    }

    if (json.additionalMetadata) {
      if (typeof json.additionalMetadata === 'string') {
        datasetList.append(`<li>Additional Metadata: ${json.additionalMetadata}</li>`)
      }
    }

    if (json.contact) {
      let contact = `Dataset contact: ${html.mailtoLink(null, json.contact, url)}`
      datasetList.append(`<li>${contact}</li>`)
    }

    if (json.contactID) {
      let contact = `Dataset contact ID: ${html.mailtoLink(null, json.contactID, url)}`
      const linked = html._maybeLink(json.contactID, 'Dataset Contact ID', '')
      datasetList.append(`<li>${linked}</li>`)
    }

    const citation = json.citation || json.datasetCitation || null
    if (citation !== null) {
      const linked = html._maybeLink(citation, 'Dataset citation', '')
      datasetList.append(`<li>${linked}</li>`)
    }

    if (json.location) {
      const loc = json.location
      const locationItem = $('<li>').text('Location of measurement:')
      const locationList = $('<ul>')
      locationList.append($('<li>').text(`Point: [${loc.point}]`))
      if (loc.units) {
        locationList.append($('<li>').text(`Units: ${loc.units}`))
      }
      if (loc.vectorComponents) {
        locationList.append($('<li>').text(`Vector Components: ${loc.vectorComponents}`))
      }
      if (loc.coordinateSystemName) {
        locationList.append($('<li>').text(`Coordinate System: ${loc.coordinateSystemName}`))
      }
      locationItem.append(locationList)
      datasetList.append(locationItem)
    }

    if (json.geoLocation) {
      const link = html.aLink('https://en.wikipedia.org/wiki/World_Geodetic_System', 'WGS84') 
      const desc = `(${link} [lat (deg), long (deg), elevevation (m)])`
      const loc = json.geoLocation
      datasetList.append(`<li>Location of measurement: [${loc}] ${desc}</li>`)
    }

    if (json.unitsSchema) {
      datasetList.append(`<li>Units Schema: <code>${json.unitsSchema}</code></li>`)
    }

    if (json.coordinateSystemSchema) {
      datasetList.append(`<li>Coordinate System Schema: <code>${json.coordinateSystemSchema}</code></li>`)
    }

    datasetList.append(`<li>Start: <code>${json.startDate}</code></li>`)
    datasetList.append(`<li>Stop: <code>${json.stopDate}</code></li>`)

    let cadence = json.cadence
    if (cadence) {
      cadence = `Cadence: ${time.ISODuration2Words(cadence)} (<code>${cadence}</code>)`
    } else {
      cadence = 'Cadence: not specified'
    }
    datasetList.append(`<li>${cadence}</li>`)

    let timeStampLocation = json.timeStampLocation
    if (timeStampLocation) {
      const li = `<li>Time Stamp Location: ${timeStampLocation}</li>`
      datasetList.append(li)
    }

    let maxRequestDuration = json.maxRequestDuration
    if (maxRequestDuration) {
      const duration = time.ISODuration2Words(maxRequestDuration)
      const li = `<li>Max Request Duration: ${duration} (<code>${maxRequestDuration}</code>)</li>`
      datasetList.append(li)
    }

    datasetList.append(html._noteAndWarningHTML(json))

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
    datasetList.append(li)
  },

  sanitizeFilename: function (filename) {
    return filename.replace('https://','').replace('http://','').replace(/[/\\?%*:|"<>]/g, '-');
  },

  showJSONOnClick: function (id, url, listID) {
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
  },

  scrollIntoView: function (id) {
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
  },

  _maybeLink: function (urlOrText, linkTextOrName, coda) {
    if (urlOrText.trim().startsWith('http')) {
      const link = html.aLink(urlOrText, linkTextOrName)
      return `${link} ${coda}`
    } else {
      return `${linkTextOrName}: ${urlOrText} ${coda}`
    }
  },

  _noteAndWarningHTML: function (json) {
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
}