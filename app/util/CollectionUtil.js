/*

The CollectionUtil object/namespace groups a bunch of functions related to:
1. collection stats obtained from the CollectionAPI in getCollectionStats()
2. collection configurations/mappings listed in /ui_components_src/search/mappings

This basically contains the logic for determining what collection (date & string) fields to use in the FacetSearchComponent.
In general what needs to be considered is:
1. Does the collection have a (human defined) mapping?
2. Does the collection have automatically generated statistics (mostly related to what type of fields are available for search)
3. Based on these two things, how do I automatically select a desirable configuration for the FacetSearchComponent (or others later on)

*/

import PersonalCollectionAPI from '../api/PersonalCollectionAPI';
import CollectionAPI from '../api/CollectionAPI';
import CKANAPI from '../api/CKANAPI';
import CollectionConfig from '../collection/mappings/CollectionConfig';
import CollectionMapping from '../collection/mappings/CollectionMapping';

import TimeUtil from '../util/TimeUtil';

const CollectionUtil = {

	//returns the correct CollectionConfig instance based on the collectionId
	getCollectionClass(collectionId, lookupMapping = true, user = null) {
		let configClass = null;
		if(lookupMapping) {
			configClass = CollectionMapping[collectionId];
			if(configClass == null) { //go through the wildcard mappings
				const temp = Object.keys(CollectionMapping).filter(k => {
					if(k.indexOf('*') != -1) {
						return collectionId.startsWith(k.substring(0, k.length -2))
					}
					return false;
				})
				configClass = temp.length == 1 ? CollectionMapping[temp[0]] : null;
			}
		}
		if(configClass == null || !lookupMapping) {
			configClass = CollectionConfig;
		}
		return configClass;
	},

	//called by the CollectionSelector
	createCollectionConfig : function(user, collectionId, collectionStats, collectionInfo) {
		const configClass = CollectionUtil.getCollectionClass(collectionId, true, user);
		return new configClass(collectionId, collectionStats, collectionInfo)
	},


	generateCollectionConfigs : function(user, collectionIds, callback, lookupMapping = true) {
		const configs = [];
		collectionIds.forEach((cid) => {
			CollectionUtil.generateCollectionConfig(user, cid, (config) => {
				configs.push(config);
				if(configs.length == collectionIds.length) {
					callback(configs);
				}
			}, lookupMapping)
		})
	},

	//make sure this works also by passing the stats
	generateCollectionConfig : function(user, collectionId, callback, lookupMapping = true) {
		const configClass = CollectionUtil.getCollectionClass(collectionId, lookupMapping, user);

		//load the stats & information asynchronously TODO (rewrite to promise is nicer)
		CollectionUtil.loadCollectionStats(user, collectionId, callback, configClass)
	},

	//loads the Elasticsearch stats of the provided collection
	loadCollectionStats(user, collectionId, callback, configClass) {
		CollectionAPI.getCollectionStats(collectionId, function(collectionStats) {
			CollectionUtil.loadCollectionInfo(user, collectionId, collectionStats, callback, configClass);
		});
	},

	//checks first whether the collection is a personal collection or not,
	//then either asks CKAN or the workspace API for info
	//TODO/FIXME the hardcoded 'personalcollection' should be replaced with the client ID!!
	loadCollectionInfo(user, collectionId, collectionStats, callback, configClass) {
		if(collectionId.startsWith('personalcollection')) {
			CollectionUtil.loadPersonalCollectionInfo(user, collectionId, collectionStats, callback, configClass);
		} else if(user){
			CollectionUtil.loadCKANInfo(user, collectionId, collectionStats, callback, configClass);
		} else {
			callback(new configClass(collectionId, collectionStats, null));
		}
	},

	//loads the CKAN metadata of the provided collection
	loadCKANInfo(user, collectionId, collectionStats, callback, configClass) {
		CKANAPI.getCollectionInfo(collectionId, function(collectionInfo) {
			callback(new configClass(collectionId, collectionStats, collectionInfo));
		});
	},

	//loads the (personal) collection metadata from the workspace API
	loadPersonalCollectionInfo(user, collectionId, collectionStats, callback, configClass) {
		//extract the workspace collection ID from the collectionID (by stripping off the user id + prefix)
		const cid = CollectionUtil.toWorkspaceAPICollectionId(user, collectionId);
		PersonalCollectionAPI.get(user.id, cid, function(collectionInfo) {
			callback(new configClass(collectionId, collectionStats, collectionInfo));
		});
	},

	toWorkspaceAPICollectionId(user, collectionId) {
		if(collectionId.indexOf('personalcollection') != -1 && user) {
			return collectionId.substring('personalcollection__'.length + user.id.length + 2);
		}
		return collectionId
	},

	SEARCH_LAYER_MAPPING : {
		'srt' : 'Subtitles',
		'asr' : 'ASR',
		'ocr' : 'OCR',
		'topics' : 'Man-made annotations',
		'enrichments' : 'Man-made annotations',
		'default' : 'Collection metadata'
	},

	getSearchLayerName(collectionId, index) {
		if(index == collectionId) {
			return CollectionUtil.SEARCH_LAYER_MAPPING['default'];
		}
		let label = 'Unknown';
		const temp = index.split('__');
		if(temp.length > 1) {
			label = CollectionUtil.SEARCH_LAYER_MAPPING[temp[1]];
			label = label ? label : '';
			if(temp.length == 3) {
				label += ' ' + temp[2];
			}
		}
		return label;
	},

	//for pruning long descriptions; makes sure to return the snippet that contains the search term
	highlightSearchTermInDescription(text, searchTerm=null, maxWords=35) {
		if(text) {
			let regex = new RegExp(searchTerm.toLowerCase(), 'gi');
			let index = text.toLowerCase().search(regex);
			index = index > 50 ? index - 50 : 0;
			text = text.substring(index);
			let words = text.split(' ');
			if(words.length > maxWords) {
				words = words.slice(index == 0 ? 0 : 1, maxWords);
			} else if(index != 0) {
				words.splice(0,1);
			}
			return words.join(' ')
		}
		return null;
	}

}

export default CollectionUtil;