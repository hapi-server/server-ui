function timerSettings(given) {

  if ($('#showtiming').prop('checked') && given["visible"] === undefined) {
    given.visible = true;
  }

  return {
    "element": given.element || "#timing",
    "updateInterval": given.updateInterval || 500,
    "visible": given.visible || false
  };
}

function timer(id,timingOptions) {

  if (id !== null) {
    // Stop timer
    let timingElement = timer[id].timingOptions.element;
    let timingUpdateInterval = timer[id].timingOptions.updateInterval;
    let timingVisible =  timer[id].timingOptions.visible;
    clearInterval(timer[id].interval);
    if (timingVisible) {
      let elapsed = ((new Date()).getTime() - timer[id].time);
      $(timingElement).html("Time: " + (elapsed) + " [ms]&nbsp;");
    } else {
      $(timingElement).empty();
    }
    return;
  }

  id = Math.random();
  timer[id] = {
                time: (new Date()).getTime(),
                timingOptions: timingOptions
              };

  let element = timingOptions.element;
  let visible = timingOptions.visible;
  let updateInterval = timingOptions.updateInterval;

  $(element).empty();

  timer[id].interval = 
          setInterval(
              () => {
                  let elapsed = ((new Date()).getTime() - timer[id].time);
                  // Round.
                  elapsed = (updateInterval/10)*parseInt(elapsed/(updateInterval/10));
                  if (visible || elapsed > updateInterval) {
                    $(element).html(`Time: ${elapsed} [ms]&nbsp;`);
                  }
              },
              updateInterval);

  return id;
}
