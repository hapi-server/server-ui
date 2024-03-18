function tooltips() {

  let instances = $.tooltipster.instances();
  $.each(instances, function(i, instance) {instance.destroy(); });

  let linkDelay = 500;
  let helpDelay = 1000;

  // Configure tooltips
  $('.tooltip').tooltipster({
    theme: 'tooltipster-noir',
    side: 'top',
    delay: linkDelay,
    animationDuration: 0
  });

  $('.tooltip-right').tooltipster({
    contentAsHTML: true,
    theme: 'tooltipster-noir',
    side: 'right',
    delay: helpDelay,
    animationDuration: 0
  });

  // Handle dynamically added content
  // https://github.com/iamceege/tooltipster/issues/558#issuecomment-221627061
  $('body')
    .on('mouseenter', '.tooltip:not(.tooltipstered)', 
      function () {
        if (!$(this).attr('title')) {
          // If title is empty string or not set, don't show tooltip
          // Could add this check in query argument after 'mouseenter'.
          return;
        }
        $(this)
          .tooltipster({
            contentAsHTML: true,
            theme: 'tooltipster-noir',
            side: 'right',
            delay: helpDelay,
            animationDuration: 0
          });
        setTimeout(function() {
          $(this).tooltipster('show');
        }.bind(this), helpDelay);
      });
}
