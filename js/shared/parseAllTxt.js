if (typeof module !== 'undefined') {
  module.exports = parseAllTxt;
}

function parseAllTxt(alltxt) {

  if (!alltxt) {
    return null;
  }

  let info = {};
  // Split and remove empty lines
  let allarr = alltxt.trim().split("\n").filter(x => x !== "");

  for (let i = 0; i < allarr.length; i++) {

    if (allarr[i].substring(0,1) === "#") {
      continue;
    }

    if (allarr[i].split(",").length == 1) {
      // Only URL given. Will occur with SERVER_LIST_HASH given.
      let id = allarr[i].trim().split(',')[0].trim();
      info[id] = {};
      info[id]['url'] = id;
      info[id]['name'] = id;
      info[id]['contactName'] = "";
      info[id]['contactEmail'] = "";
      info[id]['contactName'] = "";
    } else {
      let line = allarr[i].trim().split(',');
      for (let col in line) {
        line[col] = line[col].trim();
      }
      let id = line[2];
      if (!id) {
        continue;
      }
      info[id] = {};
      info[id]['url'] = line[0];
      info[id]['name'] = line[1] || id;
      info[id]['contactName'] = line[3] || '';
      info[id]['contactEmail'] = line[4] || '';
      if (info[id]['contactName'] === info[id]['contactEmail']) {
        info[id]['contactName'] = '';
      }
    }
  }
  if (Object.keys(info).length === 0) {
    return null;
  }
  return info;
}
