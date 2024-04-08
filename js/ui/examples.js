function examples (serversObj, cb) {
  if (!cb) cb = () => {}

  const getOptions = {
    timeout: 3000,
    dataType: 'json',
    showRequest: false,
    timer: {
      visible: false
    }
  }

  const url = 'examples/examples.json'
  util.log('examples(): Requesting ' + url)
  get({ url, ...getOptions }, (err, examplesJSON) => {
    if (err) {
      util.log(`examples(): Error when requesting ${examplesJSON}: ${err}`)
      return
    }
    util.log(`examples(): Got ${url}`)
    for (const serverID of Object.keys(serversObj).sort()) {
      const linkObj = examplesJSON[serverID]
      if (linkObj) {
        cb(createLinkHTML(linkObj, serverID))
      } else {
        // These will appear last in the list and not in alphabetical order.
        autoCreateLinkJSON(serverID, serversObj[serverID].url, cb)
      }
    }
  })

  function autoCreateLinkJSON (serverID, serverURL, cb) {
    util.log(`examples(): Auto-creating examples for ${serverURL}`)
    const linkObj = {}
    get({ url: serverURL + '/catalog', ...getOptions },
      (err, catalogObj) => {
        if (err) {
          util.log(`examples(): Failed to get catalog from ${serverURL}`)
          return
        }
        util.log(`examples(): Got ${serverURL + '/catalog'}`)

        linkObj.dataset = catalogObj.catalog[0].id

        const version = catalogObj.HAPI
        const url = util.hapi2to3(serverURL + '/info?id=' + linkObj.dataset, version)
        get({ url, ...getOptions },
          (err, infoObj) => {
            if (err || !infoObj || !infoObj.parameters) {
              util.log(`examples(): Problem with response from ${url}`)
              return
            }
            util.log(`examples(): Got ${url}`)

            if (!infoObj.parameters || infoObj.parameters.length === 0) {
              util.log(`examples(): Problem with response from ${url}`)
              return
            } else if (infoObj.parameters.length === 1) {
              linkObj.parameters = infoObj.parameters[0].name
            } else {
              linkObj.parameters = infoObj.parameters[1].name
            }
            if (infoObj.sampleStartDate) {
              linkObj.start = infoObj.sampleStartDate
              linkObj.stop = infoObj.sampleStopDate
            } else {
              linkObj.start = infoObj.startDate
              linkObj.stop = defaultDate.stop(infoObj)
            }
            cb(createLinkHTML(linkObj, serverID))
          })
      })
  }

  function createLinkHTML (linkObj, serverID) {
    const hrefo = [
      '#server=' + serverID,
      'dataset=' + linkObj.dataset,
      'parameters=' + linkObj.parameters,
      'start=' + linkObj.start,
      'stop=' + linkObj.stop
    ].join('&')

    const options = [
      {
        label: 'Show plot',
        args: 'return=image&format=svg'
      },
      {
        label: 'List data',
        args: 'return=data&format=csv'
      },
      {
        label: 'Show script options',
        args: 'return=script'
      }
    ]

    let linkHTML = ''
    for (const option of options) {
      const linkText = option.label
      postText = ` for parameter <code>${linkObj.parameters}</code> `
      postText += `of <code>${linkObj.dataset}</code> dataset`
      const href = hrefo + '&' + option.args
      linkHTML = linkHTML + `\n  <li><a href="${href}">${linkText}</a>${postText}</li>`
    }

    const linkList = '<ul>' + linkHTML + '\n</ul>\n\n'
    linkHTML = `<div id="${util.validHTMLID(serverID)}-examples"><b>${serverID}</b>\n${linkList}</div>`
    return linkHTML
  }
}
