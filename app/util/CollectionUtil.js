import CollectionAPI from '../api/CollectionAPI';

import CollectionConfig from '../collection/mappings/CollectionConfig';
import NISVCatalogueConfig from '../collection/mappings/NISVCatalogueConfig';

import TimeUtil from '../util/TimeUtil';

const CollectionUtil = {

	COLLECTION_MAPPING : {
		'nisv-catalogue-aggr': NISVCatalogueConfig,
		'nisv-catalogue-radio': NISVCatalogueConfig,
		'nisv-catalogue-tv': NISVCatalogueConfig,
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