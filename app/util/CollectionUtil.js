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

import CollectionAPI from '../api/CollectionAPI';

import CollectionConfig from '../collection/mappings/CollectionConfig';
import NISVConfig from '../collection/mappings/NISVConfig';
import NISVCatalogueConfig from '../collection/mappings/NISVCatalogueConfig';
import NISVProgramGuideConfig from '../collection/mappings/NISVProgramGuideConfig';
import TwitterConfig from '../collection/mappings/TwitterConfig';
import MotUConfig from '../collection/mappings/MotUConfig';
import EYEConfig from '../collection/mappings/EYEConfig';
import ArtTubeConfig from '../collection/mappings/ArtTubeConfig';
import RVDContractsConfig from '../collection/mappings/RVDContractsConfig';
import TimeUtil from '../util/TimeUtil';

const CollectionUtil = {

	COLLECTION_MAPPING : {
		'labs-catalogue-aggr': NISVCatalogueConfig,//should be removed when the data is deleted later on
		'nisv-catalogue-aggr': NISVCatalogueConfig,
		'nisv-catalogue-radio': NISVCatalogueConfig,
		'nisv-catalogue-tv': NISVCatalogueConfig,
		'nisv_programguides': NISVProgramGuideConfig,
		'eye-collection-desmet' : EYEConfig,
		'twitter' : TwitterConfig,
		'nisv' : NISVConfig,
		'motu' : MotUConfig,
		'arttube' : ArtTubeConfig,
		'rvd' : RVDContractsConfig
	},

	//returns the correct CollectionConfig instance based on the collectionId
	getCollectionClass(collectionId, lookupMapping = true) {
		let configClass = null;
		if(lookupMapping) {
			configClass = CollectionUtil.COLLECTION_MAPPING[collectionId];
		}
		if(configClass == null || !lookupMapping) {
			configClass = CollectionConfig;
		}
		return configClass;
	},

	//called by the CollectionSelector
	createCollectionConfig : function(collectionId, collectionStats, collectionInfo) {
		const configClass = CollectionUtil.getCollectionClass(collectionId, true);
		return new configClass(collectionId, collectionStats, collectionInfo)
	},


	generateCollectionConfigs : function(collectionIds, callback, lookupMapping = true) {
		const configs = [];
		collectionIds.forEach((cid) => {
			CollectionUtil.generateCollectionConfig(cid, (config) => {
				configs.push(config);
				if(configs.length == collectionIds.length) {
					callback(configs);
				}
			}, lookupMapping)
		})
	},

	//make sure this works also by passing the stats
	generateCollectionConfig : function(collectionId, callback, lookupMapping = true) {
		const configClass = CollectionUtil.getCollectionClass(collectionId, lookupMapping);

		//load the stats & information asynchronously TODO (rewrite to promise is nicer)
		CollectionUtil.loadCollectionStats(collectionId, callback, configClass)
	},

	//loads the Elasticsearch stats of the provided collection
	loadCollectionStats(collectionId, callback, configClass) {
		CollectionAPI.getCollectionStats(collectionId, function(collectionStats) {
			CollectionUtil.loadCollectionInfo(collectionId, collectionStats, callback, configClass);
		});
	},

	//loads the CKAN metadata of the provided collection
	loadCollectionInfo(collectionId, collectionStats, callback, configClass) {
		CollectionAPI.getCollectionInfo(collectionId, function(collectionInfo) {
			callback(new configClass(collectionId, collectionStats, collectionInfo));
		});
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
	}

}

export default CollectionUtil;