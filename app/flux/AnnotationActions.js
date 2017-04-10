import AppDispatcher from './AppDispatcher';

const AnnotationActions = {

	save : function(annotation) {
		AppDispatcher.dispatch({
            eventName: 'save-annotation',
            annotation: annotation
        });
	},

	delete : function(annotation) {
		AppDispatcher.dispatch({
            eventName: 'delete-annotation',
            annotation: annotation
        });
	},

    edit : function(annotation, subAnnotation) { //is the annotation always on the same page?
        AppDispatcher.dispatch({
            eventName: 'edit-annotation',
            annotation: annotation,
            subAnnotation : subAnnotation
        });
    },

    set : function(annotation) { //is the annotation always on the same page?
        AppDispatcher.dispatch({
            eventName: 'set-annotation',
            annotation: annotation
        });
    },

    play : function(annotation) { //is the annotation always on the same page? (no)
        AppDispatcher.dispatch({
            eventName: 'play-annotation',
            annotation: annotation
        });
    },

	changeTarget : function(annotationTarget) {
		AppDispatcher.dispatch({
            eventName: 'change-target',
            annotationTarget: annotationTarget
        });
	}

}

export default AnnotationActions;