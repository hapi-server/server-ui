function checkboxes() {

	$('#options').show(); // Show checkboxes

	// Show/Hide cache checkboxes link
	$('#cachecheckboxeslink').click(function () {
		$("#cachecheckboxes").toggle();
	})
	
	// Default for show checkbox.
	$('#showdata').each(function(){ this.checked = false });
	
	// Default for usemetadatacache checkbox.
	$('#usemetadatacache').each(function(){ this.checked = true });

	// Default for useimagecache checkbox.
	$('#useimagecache').each(function(){ this.checked = true });

	// Deal with checkboxes.
	// https://stackoverflow.com/a/5916151
	$(':checkbox').prop('checked', true);

	// Un-check
	$(':checkbox').prop('checked', false);

	// Toggle
	$(':checkbox').prop('checked', function (i, value) {
		return !value;
	});

}
