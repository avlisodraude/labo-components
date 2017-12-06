const AnnotationUtil = {


	/*************************************************************************************
	 ************************************* W3C BUSINESS LOGIC HERE ********************
	*************************************************************************************/

	//get the index of the segment within a list of annotations of a certain target
	getSegmentIndex(annotations, annotation) {
		if(annotations && annotation) {
			let i = 0;
			for(const a of annotations) {
				if(a.target.selector) {
					if(a.id == annotation.id) {
						return i;
					}
					i++;
				}
			}
		}
		return -1;
	},

	//get the nth segment within a list of annotations of a certain target
	getSegment(annotations, index) {
		if(annotations) {
			index = index < 0 ? 0 : index;
			let i = 0;
			for(const a of annotations) {
				if(a.target.selector) {
					if(i == index) {
						return a;
					}
					i++;
				}

			}
		}
		return null;
	},

	toUpdatedAnnotation(resourceId, collectionId, annotation, user, mediaObject, start, end, project) {
		if(!annotation) {
			let params = null;
			if(start && end) {
				params = {start : start, end : end}
			}
			annotation = AnnotationUtil.generateW3CEmptyAnnotation(
				resourceId,
				collectionId,
				user,
				mediaObject.url,
				mediaObject.mimeType,
				params,
				project
			);
		} else if(start && end) {
			if(annotation.target.selector.refinedBy) {
				annotation.target.selector.refinedBy.start = start;
				annotation.target.selector.refinedBy.end = end;
			} else {
				console.debug('should not be here');
			}
		}
		return annotation;
	},

	//MAJOR TODO: DETERMINE WHERE TO SET THE TIDY MEDIA OBJECT URL!
	removeSourceUrlParams(url) {
		if(url.indexOf('?') != -1) {
			return url.substring(0, url.indexOf('?'));
		}
		return url
	},

	//called from components that want to create a new annotation with a proper target
	generateW3CEmptyAnnotation : function(resourceId, collectionId, user, source, mimeType, params, project) {
		console.debug('creating empty annotation');
		console.debug(resourceId, collectionId, user, source, mimeType, params, project)
		if(!source) {
			return null;
		}
		let selector = null; //when selecting a piece of the target
		let targetType = null;

		//only try to extract/append the spatio-temporal parameters from the params if there is a mimeType
		if(mimeType) {
			if(mimeType.indexOf('video') != -1) {
				targetType = 'Video';
				if(params && params.start && params.end && params.start != -1 && params.end != -1) {
					selector = {
						type: "FragmentSelector",
						conformsTo: "http://www.w3.org/TR/media-frags/",
						value: '#t=' + params.start + ',' + params.end,
						start: params.start,
						end: params.end
	    			}
				}
			} else if(mimeType.indexOf('audio') != -1) {
				targetType = 'Audio';
				if(params && params.start && params.end && params.start != -1 && params.end != -1) {
					selector = {
						type: "FragmentSelector",
						conformsTo: "http://www.w3.org/TR/media-frags/",
						value: '#t=' + params.start + ',' + params.end,
						start: params.start,
						end: params.end
	    			}
				}
			} else if(mimeType.indexOf('image') != -1) {
				targetType = 'Image';
				if(params && params.rect) {
					selector = {
						type: "FragmentSelector",
						conformsTo: "http://www.w3.org/TR/media-frags/",
						value: '#xywh=' + params.rect.x + ',' + params.rect.y + ',' + params.rect.w + ',' + params.rect.h,
						rect : params.rect
	    			}
				}
			}
		}
		//this is basically the OLD target
		let target = {
			source: AnnotationUtil.removeSourceUrlParams(source), //TODO It should be a PID!
			selector: selector,
			type: targetType
		}

		return {
			id : null,
			user : user.id, //TODO like the selector, generate the w3c stuff here?
			target : AnnotationUtil.generateNestedPIDTarget(collectionId, resourceId, target),
			body : null,
			project : project ? project.id : null //no suitable field found in W3C so far
		}
	},

	//TODO finish this; new function for the more elaborate targeting of annotations
	//THIS IS A FUNCTION THAT NEEDS TO BE USED IN THE LONG TERM
	//generateTarget : function(resource, targetType, params) {
	generateNestedPIDTarget : function(collectionId, resourceId, target) {
		let targetType = 'MediaObject';
		let selector = {
			type: 'NestedPIDSelector',
			value: [
				{
					id: collectionId,
					type: ['Collection'],
					property: 'isPartOf'
				}
			]
		}
		if (target.selector) {
			selector['refinedBy'] = target.selector
			targetType = 'Segment'
		}

		if (resourceId){
			selector.value.push({
				id: resourceId,
				type: ['MediaObject'],
				property: 'isPartOf'
			})
			//check if it's a segment or not
			const representationTypes = ['Representation', target.type]
			if (target.selector) {
				representationTypes.push('Segment')
			}
			selector.value.push({
				id: target.source.substring(target.source.lastIndexOf('/') + 1),
				type: representationTypes,
				property: 'isRepresentation'
			})
		}

		return {
			type : targetType,
			source : target.source,
			selector : selector
		}
	},

	/*************************************************************************************
	 ************************************* W3C MEDIA FRAGMENTS HELPERS ***************
	*************************************************************************************/

	extractAnnotationTargetDetails : function(annotation) {
		let frag = AnnotationUtil.extractTemporalFragmentFromAnnotation(annotation);
		const assetId = AnnotationUtil.extractAssetIdFromTargetSource(annotation);
		if(frag) {
			return { type : 'temporal', frag : frag, assetId : assetId }
		} else {
			frag = AnnotationUtil.extractSpatialFragmentFromAnnotation(annotation);
			if(frag) {
				return { type : 'spatial', frag : frag, assetId : assetId}
			}
		}
		return {type : 'object', frag : null, assetId : assetId}
	},

	extractAssetIdFromTargetSource : function(annotation) {
		if(annotation && annotation.target && annotation.target.source) {
			if(annotation.target.source.indexOf('/') != -1) {
				return annotation.target.source.substring(annotation.target.source.lastIndexOf('/') + 1);
			}
		}
		return null;
	},

	extractTemporalFragmentFromAnnotation : function(annotation) {
		if(annotation && annotation.target && annotation.target.selector
			&& annotation.target.selector.refinedBy && annotation.target.selector.refinedBy.start) {
			return {
				start : annotation.target.selector.refinedBy.start,
				end : annotation.target.selector.refinedBy.end
			}
		}
		return null;
	},

	extractSpatialFragmentFromAnnotation : function(annotation) {
		if(annotation && annotation.target && annotation.target.selector && annotation.target.selector.refinedBy) {
			return {
				x: annotation.target.selector.refinedBy.x,
				y: annotation.target.selector.refinedBy.y,
				w: annotation.target.selector.refinedBy.w,
				h: annotation.target.selector.refinedBy.h
			}
		}
		return null;
	},

	extractTemporalFragmentFromURI : function(uri) {
		const i = uri.indexOf('#t=');
		if(i != -1) {
			const arr = uri.substring(i + 3).split(',');
			return {
				start : parseFloat(arr[0]),
				end : parseFloat(arr[1])
			}
		}
		return null;
	},

	extractSpatialFragmentFromURI : function(uri) {
		const i = uri.indexOf('#xywh=');
		if(i != -1) {
			const arr = uri.substring(i + 6).split(',');
			return {
				x : arr[0],
				y : arr[1],
				w : arr[2],
				h : arr[3]
			}
		}
		return null;
	},


	/*************************************************************************************
	 *********************EXTRACT STUFF FROM CONTAINED ANNOTATION CARDS ******************
	*************************************************************************************/

	extractAnnotationCardTitle : function(annotation) {
		if(annotation && annotation.body) {
			const cards = annotation.body.filter((a) => {
				return a.annotationType === 'metadata'
			});
			if(cards.length > 0) {
				const title = cards[0].properties.filter((p) => {
					return p.key == 'title' || p.key == 'titel';
				});
				return title.length > 0 ? title[0].value : null;
			}
		}
		return null;
	},

	/*************************************************************************************
	 ************************************* URL VALIDATION ****************************
	*************************************************************************************/

	isValidURL(url) {
		const urlPattern =/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
		return urlPattern.test(url);
	}

}

export default AnnotationUtil;