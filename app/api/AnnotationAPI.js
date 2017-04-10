const AnnotationAPI = {

	saveAnnotation : function(annotation, callback) {
		var url = _config.ANNOTATION_API_BASE + '/annotation';
		var method = 'POST';
		if(annotation.id) {
			url += '/' + annotation.id;
			method = 'PUT';
		}
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					if(callback){
						callback(JSON.parse(xhr.responseText));
					}
				} else {
					if(callback) {
						callback(null);
					}
				}
			}
		}
		xhr.open(method, url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(annotation));
	},

	getAnnotation : function(annotationId) {
		if(annotationId) {
			var url = _config.ANNOTATION_API_BASE + '/annotation/' + annotationId;
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
			xhr.send();
		}
	},

	getAnnotations : function(callback) {
		var url = _config.ANNOTATION_API_BASE + '/annotation';
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
		xhr.send();
	},

	deleteAnnotation : function (annotation, callback) {
		if(annotation.id) {
			var url = _config.ANNOTATION_API_BASE + '/annotation/' + annotation.id;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == XMLHttpRequest.DONE) {
					if(xhr.status == 200) {
						callback(JSON.parse(xhr.responseText), annotation);
					} else {
						callback(null);
					}
				}
			}
			xhr.open("DELETE", url);
			xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			xhr.send();
		}
	},

	//TODO always add the user too!
	getFilteredAnnotations : function(params, callback) {
		var url = _config.ANNOTATION_API_BASE + '/annotations/filter';
		let temp = [];
		Object.keys(params).forEach((key) => {
			temp.push(key + '=' + params[key]);
		})
		url += '?' + temp.join('&');
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
		xhr.send();
	},
}

export default AnnotationAPI;