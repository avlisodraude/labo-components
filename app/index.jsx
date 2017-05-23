//required imports for the functions
import {render} from 'react-dom';
import CollectionRecipe from './CollectionRecipe';
import SingleSearchRecipe from './SingleSearchRecipe';
import ComparativeSearchRecipe from './ComparativeSearchRecipe';
import ItemDetailsRecipe from './ItemDetailsRecipe';

//cooking function
//TODO the user variable is now filled with the INSTANCE_NAME from settings.py
//	Instead the user object (with id, name & attributes) will be passed and should be properly handled
export function cookRecipe (recipe, params, user, elementId) {
	if(recipe.type === 'item-details') {
		render(
			<ItemDetailsRecipe recipe={recipe} params={params} user={user}/>,
			document.getElementById(elementId)
		);
	} else if(recipe.type === 'single-search') {
		render(
			<SingleSearchRecipe recipe={recipe} params={params} user={user}/>,
			document.getElementById(elementId)
		);
	} else if(recipe.type === 'comparative-search') {
		render(
			<ComparativeSearchRecipe recipe={recipe} params={params} user={user}/>,
			document.getElementById(elementId)
		);
	} else if(recipe.type === 'collection-analysis') {
		render(
			<CollectionRecipe recipe={recipe} params={params} user={user}/>,
			document.getElementById(elementId)
		);
	} else {
		console.error('Please provide a valid recipe');
	}
}

//apis
export {default as AnnotationAPI} from './api/AnnotationAPI';
export {default as CollectionAPI} from './api/CollectionAPI';
export {default as SearchAPI} from './api/SearchAPI';

//collection components
export {default as CollectionSelector} from './components/collection/CollectionSelector';
export {default as CollectionStats} from './components/collection/CollectionStats';
export {default as CollectionAnalyser} from './components/collection/CollectionAnalyser';

//search components
export {default as QueryFactory} from './components/search/QueryFactory';
export {default as QueryBuilder} from './components/search/QueryBuilder';
export {default as SearchSnippet} from './components/search/SearchSnippet';
export {default as ItemDetails} from './components/search/ItemDetails';
export {default as SearchHit} from './components/search/SearchHit';

//data visualisation components
export {default as QueryComparisonLineChart} from './components/stats/QueryComparisonLineChart';

//flex components
export {default as FlexBox} from './components/FlexBox';
export {default as FlexModal} from './components/FlexModal';
export {default as FlexComponentInfo} from './components/FlexComponentInfo';

//annotation components
export {default as AnnotationBox} from './components/annotation/AnnotationBox';
export {default as CommentingForm} from './components/annotation/CommentingForm';
export {default as ClassifyingForm} from './components/annotation/ClassifyingForm';
export {default as LinkingForm} from './components/annotation/LinkingForm';

//video players
export {default as FlexPlayer} from './components/player/video/FlexPlayer';
export {default as VimeoPlayer} from './components/player/video/VimeoPlayer';
export {default as YouTubePlayer} from './components/player/video/YouTubePlayer';
export {default as JWPlayer} from './components/player/video/JWPlayer';
export {default as HTML5VideoPlayer} from './components/player/video/HTML5VideoPlayer';

//audio player
export {default as HTML5AudioPlayer} from './components/player/audio/HTML5AudioPlayer';

//image viewer
export {default as FlexImageViewer} from './components/player/image/FlexImageViewer';

//utils
export {default as CollectionUtil} from './util/CollectionUtil';
export {default as TimeUtil} from './util/TimeUtil';
export {default as ElasticsearchDataUtil} from './util/ElasticsearchDataUtil';

//collection mappings (should they be here?)
export {default as CollectionConfig} from './collection/mappings/CollectionConfig';
export {default as NISVCatalogueConfig} from './collection/mappings/NISVCatalogueConfig';
export {default as NISVProgramGuideConfig} from './collection/mappings/NISVProgramGuideConfig';