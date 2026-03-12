if (typeof module !== 'undefined') {
  module.exports = createScript
}

function createScript (sText, opts, language) {
  sText = sText.replace(/CONTACT/gm, opts.contactEmail)

  function isDoubleByte (str) {
    // https://stackoverflow.com/a/148613
    for (let i = 0, n = str.length; i < n; i++) {
      if (str.charCodeAt(i) > 255) { return true }
    }
    return false
  }

  const unicodeNote = ' contains Unicode UTF-8. See https://github.com/hapi-server/client-matlab/blob/master/README.md#notes.'
  let unicodeNoteDataset = ''
  let unicodeNoteParameters = ''
  if (isDoubleByte(opts.dataset)) {
    unicodeNoteDataset = 'Dataset name' + unicodeNote
  }
  if (isDoubleByte(opts.parametersSelected)) {
    unicodeNoteParameters = 'One or more parameters' + unicodeNote
  }
  sText = sText.replace(/UNICODE_NOTE_DATASET/gm, unicodeNoteDataset)
  sText = sText.replace(/UNICODE_NOTE_PARAMETERS/gm, unicodeNoteParameters)

  let server = opts.server
  if (!server.startsWith('http')) {
    server = location.protocol + '//' + location.host + location.pathname + server
  }

  // Determine comment character
  let c = sText.split('\n').find(line => line.includes('DATASET_NOTES'))
  if (c) {
    const whitespace = c.match(/^\s*/)[0]
    c = whitespace + c.trim().split(' ')[0]
  }
  let q = "'"
  if (language === 'wget' || language === 'curl') {
    q = ''
  }
  if (language === "julia") {
    q = '"'
  }

  let datasetNotes = `${c} Notes:\n`
  datasetNotes += `${c} 1. Use parameters=${q}${q} to request all parameters from DATASET.\n`
  datasetNotes += `${c} 2. Multiple parameters can be requested using a comma-separated \n`
  datasetNotes += `${c}    listCSV_EXAMPLE\n`
  if (server.includes('cdaweb.gsfc.nasa.gov') && /@\d+$/.test(opts.dataset)) {
    const baseDataset = opts.dataset.replace(/@\d+$/, '')
    datasetNotes += `${c} 3. The CDAWeb dataset '${baseDataset}' is split into multiple HAPI datasets.\n`
    datasetNotes += `${c}    because HAPI datasets may only have one primary time parameter.\n`
    datasetNotes += `${c}    To see the full list of HAPI datasets for this CDAWeb dataset, \n`
    datasetNotes += `${c}    enter the base dataset name ${baseDataset} in dataset drop-down \n`
    datasetNotes += `${c}    at https://hapi-server.org/servers/#server=CDAWeb.\n`
  }
  const replace = new RegExp(`${c} DATASET_NOTES`, 'gm')
  sText = sText.replace(replace, datasetNotes)

  sText = sText.replace(/SERVER/gm, server)
  sText = sText.replace(/DATASET/gm, opts.dataset)
  sText = sText.replace(/PARAMETERS/gm, opts.parametersSelected)

  sText = sText.replace(/STARTMIN/gm, opts.startDateMin)
  sText = sText.replace(/STOPMAX/gm, opts.stopDateMax)

  sText = sText.replace(/START/gm, opts.startDate)
  sText = sText.replace(/STOP/gm, opts.stopDate)

  const p = opts.parametersList

  if (p.length === 1) {
    sText = sText.replace(/CSV_EXAMPLE/gm, '.')
  } else if (p.length === 2) {
    const replace = `, e.g., parameters=${q} ${p.join(',')}${q}`
    sText = sText.replace(/CSV_EXAMPLE/gm, replace)
  } else {
    const replace = `, e.g., parameters=${q}${p.slice(1, 3).join(',')}${q}`
    sText = sText.replace(/CSV_EXAMPLE/gm, replace)
  }
  return sText
}
