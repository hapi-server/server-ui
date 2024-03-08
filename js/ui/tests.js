function tests() {

  let linkHTML = "";
  for (let [testNumber, testObject] of Object.entries(tests.testArray)) {
    let linkText = testObject['label'];
    let onclick = "";
    if (testObject['onclick']) {
      onclick = `${testObject['onclick'].replace(/;$/,'')};`
    }
    onclick = `onclick="${onclick}tests.runTest(${testNumber});"`;

    linkHTML = linkHTML + `<li><span class="test-result" id="test-${testNumber}"></span><span class="pseudoLink" ${onclick}>${linkText}</span>`;
    if (testObject['url'].startsWith('?')) {
      linkHTML = `${linkHTML}: <a href="${testObject['url']}" target="_blank">${testObject['url']}</a></li>`;
    } else {
      linkHTML = `${linkHTML}</li>`;
    }
  }
  linkHTML = "<ul>" + linkHTML + "\n</ul>\n\n";

  $('#uitests-details-body').html(linkHTML);

  // TODO: Add button to run all tests.
  //$('#tests #tests-run').click(() => runTests(testArray));

}

tests.runTest = function(testNumber) {
  $(".test-result").text("");
  let testObject = tests.testArray[testNumber];

  let beforeTestWait = testObject['beforeTestWait'] || 0;
  let testFunction   = testObject['testFunction'];

  if (testObject['beforeTest']) {
    testObject['beforeTest']();
  } else {
    window.location.hash = "";
  }

  $("#test-" + testNumber).text("… ");
  console.log(`tests(): Setting location.hash=${testObject['url']} in ${beforeTestWait} ms.`);
  setTimeout(() => {
    location.hash = testObject['url'];
    $(window).trigger('hashchange');
    setTimeout(() => {
      console.log(`tests(): Calling testFunction for '${testObject['label']}' in ${testObject['wait']} ms.`);
      testFunction(testObject['url'], (err, result) => {
        testObject['passed'] = result;
        testObject['error'] = err;
        finished(err, testObject);
      });
    }, testObject['wait']);
  }, beforeTestWait);

  function finished(err, testObject) {
    let resultString = testObject['passed'] ? 'PASS' : 'FAIL';
    let msg = `tests(): %c${resultString}%c for '${testObject['label']}'`;
    if (testObject['passed']) {
      $("#test-" + testNumber).text("✓ ");
      console.log(msg,"background: green", "background: none");
    } else {
      $("#test-" + testNumber).text("✗ ");
      console.error(msg,"background: red", "background: none");
      if (testObject['error']) console.error(testObject['error']);
    }
  }
}

tests.fetchThenTest = function(url, testQuery, cb) {
  // Special function used in tests.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1000)

  console.log("tests.fetchThenTest(): Fetching " + url);
  fetch(url, {signal: controller.signal})
    .then((resp) => {
      clearTimeout(timeoutId);
      if (resp.status !== 200) {
        console.error("tests.fetchThenTest(): Non-200 status: " + resp.status);
        cb(new Error('Non-200 response.'), false);
        return;
      }
      console.log("tests.fetchThenTest(): Got response");
      return resp.text();
    })
    .then((text) => {
      console.log("tests.fetchThenTest(): Parsed text. Calling textQuery(text).");
      cb(null, testQuery(text));
    })
    .catch((e) => {
      clearTimeout(timeoutId);
      console.error("tests.fetchThenTest(): Error:");
      console.error(e);
      cb(e, false);
    });
}

tests.throwError = function(msg) {
  // Special function used by 'Trigger generic error' test. Error thrown is in a
  // setTimeout so that it doesn't block execution of tests.runTest().
  setTimeout(() => {
    throw new Error(msg);
  },0);
}

tests.testArray = [
  {
    "url": "#server=TestData2.0&dataset=dataset1&parameters=scalar&start=1970-01-01T00:00:00Z&stop=1970-01-01T00:00:30Z&return=script",
    "label": "Show script options",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let result = $("input[lastevent='open']").length === 1;
      result = result && $("input[lastevent='open']").attr('id') === 'format';
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset1&start=1970-01-01Z&stop=1970-01-01T00:00:11Z&return=script&format=python",
    "label": "Request script without parameters",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let result = $("#script").text().includes("parameters = ''");
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset1&return=script&format=python",
    "label": "Request script without parameters, start, and stop",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let result = $("#script").text().includes("parameters = ''");
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset1&return=data",
    "label": "Request data without parameters, start, and stop",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let texts = $('#data').text().split("\n");
      let result = texts.length === 11
                && texts[0].startsWith('1970-01-01')
                && texts[0].split(",").length > 10;
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset1&parameters=scalar&start=1970-01-01Z&stop=1970-01-01T00:00:11Z&return=data&format=csv&style=noheader",
    "label": "Show data for one parameter from TestData2.0",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let texts = $('#data').text().split("\n");
      let result = texts.length === 11
                && texts[0].startsWith('1970-01-01') 
                && texts[0].split(",").length === 2;
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset1&parameters=scalar,scalarint&start=1970-01-01Z&stop=1970-01-01T00:00:11Z&return=data&format=csv&style=noheader",
    "label": "Show data for two parameters from TestData2.0",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let texts = $('#data').text().split("\n");
      let result = texts.length === 11
                && texts[0].startsWith('1970-01-01') 
                && texts[0].split(",").length === 3;
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset1&parameters=&start=1970-01-01Z&stop=1970-01-01T00:00:11Z&return=data&format=csv&style=noheader",
    "label": "Show data for all parameters from TestData2.0",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let texts = $('#data').text().split("\n");
      let result = texts.length === 11
                && texts[0].startsWith('1970-01-01') 
                && texts[0].split(",").length > 10;
      cb(null, result);
    }
  },
  {
    "url": "#server=TestData2.0&dataset=dataset3&parameters=&start=1970-01-01Z&stop=1970-01-03Z&return=image&format=hapiplot&style=svg",
    "label": "Plot all parameters from TestData2.0",
    "beforeTestWait": "1000",
    "beforeTest": function() {
      window.location.hash = "";
    },
    "wait": 1000,
    "testFunction": function (url, cb) {
      cb(null, $("#output").find("img").length > 10)
    }
  },
  {
    "url": "?server=TestData2.0&dataset=dataset1&return=script&format=python",
    "label": "Request script through API",
    "wait": 0,
    "testFunction": function (url, cb) {
      function testQuery(text) {
        if (typeof text !== 'string') return false;
        return text.includes("parameters = ''");
      }
      tests.fetchThenTest(url, testQuery, cb);
    }
  },
  {
    "url": "?server=TestData2.0&dataset=dataset1&return=script-options",
    "label": "Request script through API",
    "wait": 0,
    "testFunction": function (url, cb) {
      function testQuery(text) {
        if (typeof text !== 'string') {
          cb(new Error("Invalid response"), null);
        }
        let json;
        try {
          json = JSON.parse(text);
        } catch (err) {
          cb(err, null);
        }
        return json && json[0] && json[0]["label"];
      }
      tests.fetchThenTest(url, testQuery, cb);
    }
  },
  {
    "url": "#server=CDAWeb&dataset=AC_H0_MFI&parameters=Magnitude&start=1997-09-02T00:00:12Z&stop=1997-09-04T00:00:12.000Z&return=image&format=cdaweb&style=gif",
    "label": "Request GIF image from CDAWeb",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let el = $("#plot-details").next().find("img").attr("src");
      if (!el)  return cb(null, false);
      cb(null, el.endsWith("gif"));
    }
  },
  {
    "url": "#server=CDAWeb&dataset=AC_H0_MFI&parameters=Magnitude&start=1997-09-02T00:00:12Z&stop=1997-09-04T00:00:12.000Z&return=image&format=cdaweb&style=pdf",
    "label": "Request PDF image from CDAWeb",
    "wait": 1000,
    "testFunction": function (url, cb) {
      let el = $("#plot-details").next().find("iframe").attr("src");
      if (!el)  return cb(null, false);
      cb(null, el.includes(".pdf"));
    }
  },
  {
    "url": "#server=https://hapi-server.org/servers/TestData3.1/hapi",
    "label": "Enter server=URL in hash",
    "wait": 1000,
    "onclick": "",
    "testFunction": function (url, cb) {
      let result = $('#dataset').is(":visible")
      result = result && $("#dataset").autocomplete( "option", "source" ).length > 0;
      cb(null, result);
    }
  },
  {
    "url": "#server=https://hapi-server.org/servers/TestData3.1/hapix",
    "label": "Enter server=URL with 404 URL in hash",
    "wait": 1000,
    "onclick": "",
    "testFunction": function (url, cb) {
      let result = $("#datasetsRequestError").text().includes("Failed to");
      cb(null, result);
    }
  },
  {
    "url": "",
    "label": "Enter URL in server dropdown",
    "wait": 0,
    "onclick": "",
    "testFunction": function (url, cb) {
      main();
      url = "https://hapi-server.org/servers/TestData3.1/hapi";
      $('input[id=server]')
        .val(url)
        .data("autocomplete")
        ._trigger("select", null, {item: url});
      cb(null, true);
    }
  },
  {
    "url": "#server=X",
    "label": "Trigger invalid server selection",
    "beforeTestWait": "1000",
    "beforeTest": function() {
      window.location.hash = "#server=TestData2.0";
    },
    "wait": 1000,
    "testFunction": function (url, cb) {
      let result = location.hash === "";
      return cb(null, result);
    }
  },
  {
    "url": "#",
    "label": "Trigger generic error",
    "onclick": "tests.throwError('Generic error message');",
    "wait": 1000,
    "testFunction": function (url, cb) {
      cb(null, $('#appError').text().includes('Generic error message'));
    }
  }
];
