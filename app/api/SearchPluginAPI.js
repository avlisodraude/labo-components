//TODO rewrite to native Javascript

const SearchPluginAPI = {

	listRegisteredPlugins: function(callback) {
	    var url = _config.SEARCH_API_BASE  + "/plugin";
	    d3.json(url, function(error, data) {
	        callback(data);
	    });
	},

	getNamedQuery: function(plugin, user, queryName, callback) {
	    var url = _config.SEARCH_API_BASE  + "/plugin/" + plugin;
	    url += '/user/' + user + '/' + queryName;
	    d3.json(url, function(error, data) {
	        callback(data);
	    });
	},

	executeNamedQuery: function(plugin, user, queryName, params, callback) {
	    var url = _config.SEARCH_API_BASE  + "/plugin/" + plugin;
	    url += '/user/' + user + '/' + queryName + '/execute';
	    Object.keys(params).forEach((key, index) => {
	    	let c = index == 0 ? '?' : '&';
	    	url += c + key + '=' + params[key];

	    });
	    console.debug(url);
	    d3.json(url, function(error, data) {
	        callback(data);
	    });
	}


}

export default SearchPluginAPI;