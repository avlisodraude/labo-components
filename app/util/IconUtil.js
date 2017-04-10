const IconUtil = {

	//TODO somehow also allow recipes to override icons?
	getAnnotationTemplateIcon(template) {
		if(template == 'av' || template == 'video') {
			return 'glyphicon glyphicon-film';
		} else if(template == 'audio') {
			return 'fa fa-signal';
		} else if(template == 'artwork') {
			return 'fa fa-paint-brush';
		} else if(template == 'link') {
			return 'glyphicon glyphicon-link';
		} else if(template == 'image') {
			return 'glyphicon glyphicon-picture';
		} else if(template == 'article' || template == 'text') {
			return 'glyphicon glyphicon-book';
		} else if(template == 'person') {
			return 'glyphicon glyphicon-user';
		}
		return 'glyphicon glyphicon-question-sign';
	},

	getMimeTypeIcon(mimeType) {
		if(mimeType.indexOf('video') != -1) {
			return 'glyphicon glyphicon-film';
		} else if(mimeType.indexOf('audio') != -1) {
			return 'glyphicon glyphicon-equalizer';
		} else if(mimeType.indexOf('image') != -1) {
			return 'glyphicon glyphicon-picture';
		}
		return 'glyphicon glyphicon-question-sign';
	}
}

export default IconUtil;