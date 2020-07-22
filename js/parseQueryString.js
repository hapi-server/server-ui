function parseQueryString() {
	// http://paulgueller.com/2011/04/26/parse-the-querystring-with-jquery/
	var nvpair = {};
	var qs = window.location.hash.replace('#', '');
	if (qs.length == 0) {
		return {};
	}
	var pairs = qs.split('&');
	$.each(pairs, function(i, v){
	  var pair = v.split('=');
	  nvpair[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g," "));
	});
	return nvpair;				
}
