import AnnotationAPI from '../api/AnnotationAPI';

const BookmarkUtil = {

	//FIXME: sync offline annotation target, so no empty annotation (without a target) will remain!
	deleteBookmarks : function(annotationList, bookmarkList, bookmarks, callback) {
		console.debug(annotationList)
		console.debug(bookmarkList)
		console.debug(bookmarks)

		let count = 0;

		bookmarks.forEach((b) => {
			const targets = bookmarkList.filter(
				bookmark => b.annotationId == bookmark.annotationId
	    	);
			bookmarkList = bookmarkList.filter(
				bookmark => b.targetId != bookmark.targetId
	    	);

		    //if there is only one target it means the selected bookmark was the last target of the parent annotation
		    if(targets.length == 1) {
		      //set the id to the annotationId so the API knows which actual annotation needs to be deleted
		      b.id = b.annotationId;

		      //delete the bookmark
		      AnnotationAPI.deleteAnnotation(b, data => {
		        if (data && data.status) {
		          if (data.status == 'success') {
		            console.debug('success');
		          } else {
		           console.debug('error');
		          }
		        } else {
		          console.debug('error');
		        }
		        if(++count == bookmarks.length) {
		    		console.debug('all done calling back the caller');
		    		callback(true)
		    	}
		      });
		    } else {
		      const annotation = annotationList.filter(a => a.id == b.annotationId)[0];
		      annotation.target = annotation.target.filter(t => t.source != b.targetId);
		      AnnotationAPI.saveAnnotation(annotation, data => {
		        if (data && data.status) {
		          if (data.status == 'success') {
		            console.debug('success');
		          } else {
		            console.debug('error');
		          }
		        } else {
		          console.debug('error');
		        }
		        if(++count == bookmarks.length) {
		    		console.debug('all done calling back the caller');
		    		callback(true)
		    	}
		      });
		    }

		});

	}
}

export default BookmarkUtil;