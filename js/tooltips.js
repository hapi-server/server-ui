function tooltips() {

  // Configure tooltips
  // https://github.com/iamceege/tooltipster/issues/558#issuecomment-221627061
  $('.tooltip').tooltipster({
    theme: 'tooltipster-noir',
    side: 'top',
    delay: 500
  })
  $('.tooltip-right').tooltipster({
    contentAsHTML: true,
    theme: 'tooltipster-noir',
    side: 'right',
    delay: 500
  })
  $('body')
    .on('mouseenter', '.tooltip:not(.tooltipstered)', 
      // Handle dynamically added content
      function () {
        $(this)
          .tooltipster({
            contentAsHTML: true,
            theme: 'tooltipster-noir',
            side: 'right',
            delay: 500,
            animationDuration: '0',
          })
          .tooltipster('show');
      });  
}
