const ProjectAPI = {


	save : function (userId, project, callback) {
		let url = _config.PROJECT_API_BASE + '/' + userId + "/projects";
		let method = 'POST'
		if (project.id) {
			url += '/' + project.id;
			method = 'PUT';
		}
	    const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
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
		xhr.send(JSON.stringify(project));
	},

	delete : function(userId, projectId, callback) {
		const url = _config.PROJECT_API_BASE + '/' + userId + '/projects/' + projectId;
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if(respData && !respData.error) {
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

	list : function(userId, filter, callback) {
		// todo: add filters to request
		const url = _config.PROJECT_API_BASE + '/' + userId + '/projects';
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					const respData = JSON.parse(xhr.responseText);
					if(respData && !respData.error) {
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

export default ProjectAPI;