import TimeUtil from './util/TimeUtil';
import IDUtil from './util/IDUtil';
import IconUtil from './util/IconUtil';
import ComponentUtil from './util/ComponentUtil';

import FlexBox from './components/FlexBox';
import FlexModal from './components/FlexModal';
import FlexPlayer from './components/player/video/FlexPlayer';
import FlexImageViewer from './components/player/image/FlexImageViewer';

import MetadataTable from './components/search/MetadataTable';

import SearchAPI from './api/SearchAPI';

import AnnotationAPI from './api/AnnotationAPI';
import AnnotationUtil from './util/AnnotationUtil'
import AnnotationBox from './components/annotation/AnnotationBox';
import AnnotationList from './components/annotation/AnnotationList';

import AnnotationActions from './flux/AnnotationActions';
import AnnotationStore from './flux/AnnotationStore';

import CollectionUtil from './util/CollectionUtil';

/*
	1. The ItemDetailsRecipe takes care of tying the components together according to the recipe
	2. Each media player (and any other annotation target) in the recipe takes care of loading its own annotations
	3. Ideally the whole query that led to this page should be reflected in the GET parameters (for sharing)
	4. There can only be one active annotation; this recipe must know which component has the active annotation?
	5.

	leesvoer: http://blog.andrewray.me/flux-for-stupid-people/

	TODO:
	- make sure this old crap is replaced with something new:
		- the fq annotations were found on this record/program
			- however the annotations are related to media fragments (also)
			- distinguish loading of media fragment annotations & record/program annotations

*/

class ItemDetailsRecipe extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			user : this.props.user || 'JaapTest',
			showModal : false, //triggered by the media players whenever an annotation needs to be edited
			itemData : null, //populated from componentDidMount
			activeMediaTab : 0, //which tab, i.e. media player, is visible/active

			//These variables are passed on to the media players (as props) that actually show the annotations.
			//These variables are filled by listening to the AnnotationStore, which are triggered by the players...
			//TODO All this is kind of weird and should be optimised
			activeAnnotation: null,
			activeSubAnnotation: null,//TODO this will be removed whenever switching to the new graph model
			annotationTarget : null,

			found : false //whether the item metadata could be found
		}
		this.tabListeners = false;
		this.CLASS_PREFIX = 'rcp__id'
	}

	//starts listening to any annotation actions, triggered by the players, and fetches the item details
	componentDidMount() {
		//make sure to listen to the correct events (TODO determine this based on the recipe)
		AnnotationStore.bind('edit-annotation', this.editAnnotation.bind(this));
		AnnotationStore.bind('set-annotation', this.setActiveAnnotation.bind(this));
		AnnotationStore.bind('play-annotation', this.setActiveAnnotation.bind(this));
		AnnotationStore.bind('save-annotation', this.onSaveAnnotation.bind(this));
		AnnotationStore.bind('del-annotation', this.onDeleteAnnotation.bind(this));

		if(this.props.params.id && this.props.params.cid) {
			SearchAPI.getItemDetails(
				this.props.params.cid,
				this.props.params.id,
				this.onLoadItemData.bind(this)
			);
		}
	}

	//makes sure to update the annotation target whenever the user selects another media object by
	//navigating to another tab (currently each media object is put under a tab...)
	//TODO replace the stupid tabs with a select box or something
	componentDidUpdate() {
		//FIXME a horrible way to attach a tab listener here instead of in componentDidMount
		//(for now we have to wait until the jquery is available... )
		if(!this.tabListeners) {
			$('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
				var target = $(e.target).attr("href") // activated tab
				var index = target.substring('#mo__'.length);
				var annotationTarget = this.getAnnotationTarget(this.state.itemData, index)
				if(annotationTarget) {
					this.setActiveAnnotationTarget.call(this, annotationTarget);
				} else {
					console.debug('There is no valid target?');
				}

			}.bind(this));
			this.tabListeners = true;
		}
	}

	//determine which (media object) target on the page should be the active annotation target
	getAnnotationTarget(itemDetailData, index=0) {
		if(itemDetailData && itemDetailData.playableContent) {
			var mediaObject = itemDetailData.playableContent[index];
			if(mediaObject) {
				let annotation = AnnotationUtil.generateW3CEmptyAnnotation(
					this.state.user,
					mediaObject.url,
					mediaObject.mimeType
				);
				return annotation.target;
			}
		}
		return null;
	}

	onLoadItemData(collectionId, resourceId, data) {
		let found = data ? data.found : false;
		if(collectionId && found != false) {
			CollectionUtil.generateCollectionConfig(collectionId, function(config){
				let itemDetailData = config.getItemDetailData(data);
				found = itemDetailData == null ? false : true;
				if(found) {
					this.setState({
						itemData : itemDetailData,
						annotationTarget : this.getAnnotationTarget.call(this, itemDetailData),
						found : true
					});
				}
			}.bind(this));
		}
		if(found == false) {
			this.setState({
				itemData : data,
				annotationTarget : null,
				found : false
			})
			console.debug('this item does not exist');
		}
	}

	/* ------------------------------------------------------------------------------
	------------------------------- ANNOTATION RELATED FUNCTIONS --------------------
	------------------------------------------------------------------------------- */

	onSaveAnnotation(annotation) {
		console.debug('just saved an annotation, closing the modal');
		ComponentUtil.hideModal(this, 'showModal' , 'annotation__modal', true);
	}

	onDeleteAnnotation(annotation) {
		console.debug('just deleted an annotation, closing the modal');
		ComponentUtil.hideModal(this, 'showModal', 'annotation__modal', true);
	}

	//TODO currently this is only called via the ugly componentDidUpdate() function
	setActiveAnnotationTarget(annotationTarget) {
		this.setState(
			{annotationTarget : annotationTarget}
		);
		AnnotationActions.changeTarget(annotationTarget)
	}

	//overall there can be only one active annotation
	//TODO extend with activeSubAnnotation?
	setActiveAnnotation(annotation) {
		this.setState({
			activeAnnotation : annotation
		})
	}

	//show the annnotation form with the correct annotation target
	//TODO extend this so the target can also be a piece of text or whatever
	editAnnotation(annotation, subAnnotation) {
		//TODO this should simply always just set the active annotation
		//an annotation ALWAYS has a target, but not always a body or ID (in case of a new annotation)
		if(annotation.target) {
			this.setState({
				showModal: true,
				annotationTarget: annotation.target,
				activeAnnotation: annotation,
				activeSubAnnotation : subAnnotation
			});
		}
	}

	render() {
		if(!this.state.itemData) {
			return (<h4>Loading item</h4>);
		} else if(!this.state.found) {
			return (<h4>This item does not exist</h4>);
		} else {
			let annotationBox = null;
			let annotationList = null;
			let uniqueMetadata = null;
			let poster = null;
			let source = null;
			let metadataPanel = null;
			let mediaPanel = null;
			let mediaTabs = null;
			let mediaTabContents = null;

			//on the top level we only check if there is any form of annotationSupport
			if(this.props.recipe.ingredients.annotationSupport) {
				if(this.state.showModal) {
					annotationBox = (
						<FlexModal
							elementId="annotation__modal"
							stateVariable="showModal"
							float="right"
							owner={this}
							title={'Annotate: ' + AnnotationUtil.extractAssetIdFromTargetSource(
								this.state.activeAnnotation)
							}>
							<AnnotationBox
								user={this.state.user} //current user
								annotation={this.state.activeAnnotation}
								activeSubAnnotation={this.state.activeSubAnnotation}
								annotationModes={this.props.recipe.ingredients.annotationModes}/>
						</FlexModal>
					);
				}
				annotationList = (
					<AnnotationList
						user={this.state.user} //current user
						activeAnnotation={this.state.activeAnnotation} //the active annotation
						annotationTarget={this.state.annotationTarget} //the current annotation target (later this can be also an annotation)
					/>
				);
			}

			//render the complete metadata block, which includes unique and basic metadata
			metadataPanel = (
				<FlexBox title="Metadata">
					<MetadataTable data={this.state.itemData}/>
				</FlexBox>
			)

			//media objects
			if(this.state.itemData.playableContent) {
				let mediaObjectTypes = [];

				//first generate the tabs
				mediaTabs = this.state.itemData.playableContent.map((mediaObject, index) => {
					let iconClass = IconUtil.getMimeTypeIcon(mediaObject.mimeType);
					return (
						<li key={index + '__mt'}
							className={this.state.activeMediaTab == index ? 'active' : ''}>
							<a data-toggle="tab" href={'#__mo' + index}>
								<span className={iconClass}></span>&nbsp;#{index}
							</a>
						</li>
					)
				}, this)

				//then generate the tab contents
				mediaTabContents = this.state.itemData.playableContent.map((mediaObject, index) => {
					let mediaPlayer = 'Unknown Media Object: ' + index;
					mediaObject.id = index; //assign an ID so each player has a unique ID for the UI
					//assume that the first item of the playable content is the main one
					if(index == 0) {//TODO test this better
						mediaObject.start = this.props.params.s;
						mediaObject.end = this.props.params.e;
					}
					if(mediaObject.mimeType.indexOf('video') != -1) {//render a video player
						mediaPlayer = (
							<FlexPlayer
								user={this.state.user} //current user
								mediaObject={mediaObject} //TODO make this plural for playlist support
								active={this.state.activeMediaTab == index}
								enableFragmentMode={false} //add this to config
								annotationSupport={this.props.recipe.ingredients.annotationSupport} //annotation support the component should provide
								annotationLayers={this.props.recipe.ingredients.annotationLayers} //so the player can distribute annotations in layers
								setActiveAnnotationTarget={this.setActiveAnnotationTarget.bind(this)}//so the component can callback the active mediaObject
							/>
						);
					} else if (mediaObject.mimeType.indexOf('audio') != -1) { //TODO integrate audio within the flex player
						mediaPlayer = (
							<FlexPlayer
								user={this.state.user} //current user
								mediaObject={mediaObject} //TODO make this plural for playlist support
								active={this.state.activeMediaTab == index}
								enableFragmentMode={false} //add this to config
								annotationSupport={this.props.recipe.ingredients.annotationSupport} //annotation support the component should provide
								annotationLayers={this.props.recipe.ingredients.annotationLayers} //so the player can distribute annotations in layers
								setActiveAnnotationTarget={this.setActiveAnnotationTarget.bind(this)}//so the component can callback the active mediaObject
							/>
						);
					} else if (mediaObject.mimeType.indexOf('image') != -1) { //TODO detect a iiif url and create a cool iiif component
						mediaPlayer = (
							<FlexImageViewer
								user={this.state.user} //current user
								mediaObject={mediaObject}//TODO make this plural for playlist support
								active={this.state.activeMediaTab == index}
								annotationSupport={this.props.recipe.ingredients.annotationSupport} //annotation support the component should provide
								annotationLayers={this.props.recipe.ingredients.annotationLayers} //so the player can distribute annotations in layers
								editAnnotation={this.editAnnotation.bind(this)} //each annotation support should call this function
								setActiveAnnotationTarget={this.setActiveAnnotationTarget.bind(this)}//so the component can callback the active mediaObject
							/>
						);
					} else if(mediaObject.mimeType.indexOf('application') != -1) { //e.g. for old Flash players
						mediaPlayer = (
							<iframe src={mediaObject.url} width="650" height="550"/>
						);
					}

					return (
						<div key={index + '__mtc'}
							id={'__mo' + index}
							className={this.state.activeMediaTab == index ? 'tab-pane active' : 'tab-pane'}>
							<div className={IDUtil.cssClassName('media-player', this.CLASS_PREFIX)}>
								{mediaPlayer}
							</div>
						</div>
					);
				}, this);

				//finally generate the mediaPanel
				mediaPanel = (
					<FlexBox title="Related media objects">
						<ul className="nav nav-tabs">
							{mediaTabs}
						</ul>
						<div className="tab-content">
							{mediaTabContents}
						</div>
					</FlexBox>
				);
			}

			return (
				<div className={IDUtil.cssClassName('item-details-recipe')}>
					<div className="row">
						<div className="col-md-12">
							<br/>
							{mediaPanel}
							<div className="row">
								<div className="col-md-7">
									{metadataPanel}
								</div>
								<div className="col-md-5">
									{annotationList}
									{annotationBox}
								</div>
								<br/>
							</div>
						</div>
					</div>
				</div>
			)
		}
	}

}

export default ItemDetailsRecipe;