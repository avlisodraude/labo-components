const ExternalAPI = {

	autocomplete: function(vocabulary, term, callback) {
		let url = '/autocomplete?vocab=' + vocabulary + '&term=' + term;
	    var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					callback(JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}
			}
		}
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(null);
		return xhr;
	},

	search: function(api, searchTerm, callback) {
		let url = '/link/' + api + '/search?q=' + searchTerm;
	    var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					callback(JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}
			}
		}
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(null);
		return xhr;
	}
}

export default ExternalAPI;