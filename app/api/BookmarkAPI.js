import AnnotationAPI from './AnnotationAPI';
import AnnotationUtil from '../util/AnnotationUtil';

const BookmarkAPI = {

	save : function(resourceId, collectionId, annotationTarget, user, project, callback) {
		let bookmark = generateW3CEmptyAnnotation(
			resourceId,
			collectionId,
			user,
			annotationTarget.source,
			mimeType,
			params,
			project
		)
		AnnotationAPI.saveAnnotation(bookmark, callback);
	},

	//simply forward to the annotation API
	delete : function(annotation, callback) {
		AnnotationAPI.deleteAnnotation(annotation, callback);
	},

	getByAnnotationTarget(user, project, annotationTarget, callback) {
		AnnotationAPI.getFilteredAnnotations({
			'target.source' : annotationTarget.source,
			'user.keyword' : user.id,
			'project' : project.id
		}, callback);
	}

}

export default BookmarkAPI;