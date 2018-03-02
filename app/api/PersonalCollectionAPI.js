const PersonalCollectionAPI = {

	save : function (userId, collection, callback) {
		let url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + "/collections";
		let method = 'POST'
		if (collection.id) {
			url += '/' + collection.id;
			method = 'PUT';
		}
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					console.log(xhr);
					const respData = JSON.parse(xhr.responseText);
					if(respData && ! respData.error) {
						callback(JSON.parse(xhr.responseText));
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
		xhr.open(method, url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(collection));
	},

	saveEntry : function(userId, collectionId, entry, callback){
		if ("id" in entry) {
			var url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + "/collections/" + encodeURIComponent(collectionId) + "/entry/" + encodeURIComponent(entry['id']);
		} else {

			var url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + "/collections/" + encodeURIComponent(collectionId) + "/entry";
		}
		let method = 'POST'

		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if(respData && ! respData.error) {
						callback(JSON.parse(xhr.responseText));
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
		xhr.open(method, url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(entry));
	},

	delete : function(userId, collectionId, callback) {
		const url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + '/collections/' + encodeURIComponent(collectionId);
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if (respData && !respData.error) {
						callback(respData);
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
		xhr.open("DELETE", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send();
	},

	deleteEntry : function(userId, collectionId, entryId, callback) {
		var xhr = new XMLHttpRequest();
	    var url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + '/collections/'+ collectionId + '/entry/'+ entryId;

	    xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if (respData && !respData.error) {
						callback(respData);
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
	    xhr.open('DELETE', url, true);
	    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	    xhr.send();
	},

	list : function(userId, filter, callback) {
		const url = _config.PERSONAL_COLLECTION_API_BASE + "/" + userId + "/collections";
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if (respData && !respData.error) {
						callback(respData);
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send();
	},

	get : function(userId, collectionId, callback) {
		const url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + '/collections/' + encodeURIComponent(collectionId);
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if (respData && !respData.error) {
						callback(respData);
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send();
	},

	getEntry : function(userId, collectionId, entryId, callback) {
		const url = _config.PERSONAL_COLLECTION_API_BASE + '/' + userId + '/collections/' + encodeURIComponent(collectionId) + '/entry/' + encodeURIComponent(entryId);
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if (respData && !respData.error) {
						callback(respData);
					} else {
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		}
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send();
	}

}

export default PersonalCollectionAPI;