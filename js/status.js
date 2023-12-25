function status(msg, type) {
  let color = 'white';
  if (type === 'warning') {
      color = 'yellow';
  }
  if (type === 'error') {
    color = 'red';
  }
  let style = `font-size:80%;background-color:${color}`;
  $('#xstatus').empty().append(`<p><span style='${style}'>${msg}</span></p>`);
}