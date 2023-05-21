function timer(id) {

  let updateInterval = 500;

  let showtiming = $('#showtiming').attr('checked') === "checked";

  if (id) {
    clearInterval(timer[id].interval);
    if (showtiming === false || timer[id].clearTiming) {
      $('#timing').empty();
    } else {
      let elapsed = ((new Date()).getTime() - timer[id].time);
      $("#timing").text("Time: " + (elapsed) + " [ms]");
    }
    return;
  }

  let clearTiming = false;
  if (selected('return') === 'image') {
    // Always show timing for images, for feedback
    showtiming = true;
    clearTiming = true;
  }
  if (selected('return') === 'data' && $('#showdata').attr('checked')) {
    // Always show timing for data, for feedback
    showtiming = true;
    clearTiming = true;
  } 

  $('#timing').empty();
  if (showtiming) {
    $("#timing").text("Time:      ms");
  }

  id = Math.random();
  timer[id] = {time: (new Date()).getTime()};
  timer[id].interval = 
          setInterval(
              () => {
                  let elapsed = ((new Date()).getTime() - timer[id].time);
                  if (elapsed > updateInterval) {
                    if (showtiming === false) {
                      // Request took more than updateInterval. Show
                      // timing for feedback.
                      timer[id].clearTiming = true;                      
                    }
                    showtiming = true;
                  }
                  elapsed = 100*parseInt(elapsed/100); // Round
                  if (showtiming) {
                    $("#timing").text("Time: " + (elapsed) + "  ms");
                  }
              },
              updateInterval);
  return id;
}
