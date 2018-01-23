import CollectionSelector from './components/collection/CollectionSelector';
import ProjectSelector from './components/projects/ProjectSelector';
import BookmarkSelector from './components/bookmark/BookmarkSelector';

import QueryBuilder from './components/search/QueryBuilder';
import SearchHit from './components/search/SearchHit';
import Paging from './components/search/Paging';
import Sorting from './components/search/Sorting';

import FlexBox from './components/FlexBox';
import FlexModal from './components/FlexModal';
import FlexRouter from './util/FlexRouter';

import IDUtil from './util/IDUtil';
import ElasticsearchDataUtil from './util/ElasticsearchDataUtil';
import CollectionUtil from './util/CollectionUtil';
import ComponentUtil from './util/ComponentUtil';
import AnnotationUtil from './util/AnnotationUtil';

import SearchAPI from './api/SearchAPI';
import AnnotationAPI from './api/AnnotationAPI';

class SingleSearchRecipe extends React.Component {
	constructor(props) {
		super(props);
		let collectionId = null;
		if(this.props.params.cids) {
			collectionId = this.props.params.cids.split(',')[0];
		} else {
			collectionId = this.props.recipe.ingredients.collection;
		}
		this.state = {
			showModal : false, //for the collection selector
			showProjectModal : false, //for the project selector
			showBookmarkModal : false, //for the bookmark group selector
			activeProject : ComponentUtil.getJSONFromLocalStorage('activeProject'),
			awaitingProcess : null, //which process is awaiting the output of the project selector
			collectionId : collectionId,
			pageSize : 20,
			collectionConfig : null,
			selectedRows : {},
			allRowsSelected : false
		};
		this.CLASS_PREFIX = 'rcp__ss'
	}

	componentDidMount() {
		if(this.state.collectionId) {
			CollectionUtil.generateCollectionConfig(this.state.collectionId, this.onLoadCollectionConfig.bind(this), true);
		}
	}

	onLoadCollectionConfig(config) {
		this.setState({collectionConfig : config});
	}

	//this function receives all output of components that generate output and orchestrates where
	//to pass it to based on the ingredients of the recipe
	//TODO change this, so it knows what to do based on the recipe
	onComponentOutput(componentClass, data) {
		if(componentClass == 'QueryBuilder') {
			this.onSearched(data);
		} else if(componentClass == 'CollectionSelector') {
			this.setState(
				{
					collectionId : data.collectionId,
					collectionConfig : data,
					currentOutput : null,
				},
				this.onCollectionChange(data)
			);
		} else if(componentClass == 'SearchHit') {
			if(data) {
				const selectedRows = this.state.selectedRows;
				if(data.selected) {
					selectedRows[data.resourceId] = true;
				} else {
					delete selectedRows[data.resourceId]
				}
				this.setState({
					selectedRows : selectedRows,
					allRowsSelected : data.selected ? this.state.allRowsSelected : false
				})
			}
		} else if(componentClass == 'ProjectSelector') {
			this.setState(
				{activeProject : data},
				() => {
					this.onProjectChanged.call(this, data)
				}
			);
		} else if(componentClass == 'BookmarkSelector') {
			this.bookmarkToGroupInProject(data);
		}
	}

	onCollectionChange(collectionConfig) {
		ComponentUtil.hideModal(this, 'showModal', 'collection__modal', true)
		this.setBrowserHistory(null, null, 0, this.state.pageSize, null, null, null, null, collectionConfig.collectionId);
	}

	onSearched(data) {
		this.setState({
			currentOutput: data,
			allRowsSelected : false,
			selectedRows : {}
		});
		if(data && data.params && data.updateUrl) {
			this.setBrowserHistory(
				data.params.term,
				data.params.fieldCategory,
				data.params.offset,
				data.params.size,
				data.params.selectedFacets,
				data.params.dateRange,
				data.params.sort,
				data.params.searchLayers,
				data.collectionConfig.getSearchIndex()
			);
		}
	}

	setBrowserHistory(searchTerm, fieldCategory, offset, pageSize, selectedFacets, dateRange, sortParams, searchLayers, collection) {
		const params = {
			fr : offset,
			sz : pageSize,
			cids : collection
		}
		let sf = []
		if(selectedFacets) {
			sf = Object.keys(selectedFacets).map((key) => {
				return selectedFacets[key].map((value) => {
					return key + '|' + value;
				})
			});
			params['sf'] = sf.join(',');
		}
		if(searchTerm) {
			params['st'] = searchTerm;
		}

		if(fieldCategory) {
            params['fc'] ='';
            fieldCategory.map(function(item){
                params['fc'] += item.id + '|';
			});
            params['fc'] = params['fc'].slice(0, -1);
		}

		if(dateRange) {
			let dr = dateRange.field + '__';
			dr += dateRange.start + '__';
			dr += dateRange.end;
			params['dr'] = dr;
		}
		if(sortParams) {
			let s = sortParams.field + '__';
			s += sortParams.order;
			params['s'] = s;
		}

		if(searchLayers) {
			const sl = Object.keys(searchLayers).filter((l) => {
				return searchLayers[l];
			});
			if(sl.length > 0) {
				params['sl'] = sl.join(',');
			}
		}

		FlexRouter.setBrowserHistory(
			params, //will also be stored in the browser state (cannot exceed 640k chars)
			this.constructor.name //used as the title for the state
		)
	}

	//TODO move this to the recipe level
	//TODO this is called twice by render... optimise!
	/*
		http://localhost:5302/recipe/beng-catalogue-search
		?st=werk
		&sf=bg:keywords.bg:keyword|onderwijs
		&fr=0&sz=25&cids=nisv
		&sl=nisv,nisv__asr
		&fc=titles
		&dr=date__-441849600000__599616000000
		&sort=date__desc
	*/
	extractSearchParams() {
		if(this.props.params) {
			const numParams = Object.keys(this.props.params).length;
			if(numParams == 0) {
				return null;
			} else if(numParams == 1 && this.props.params.cids) {
				return null;
			}
		} else {
			return null;
		}
		const searchTerm = this.props.params.st ? this.props.params.st : '';
		const fc = this.props.params.fc;
		const fr = this.props.params.fr ? this.props.params.fr : 0;
		const size = this.props.params.sz ? this.props.params.sz : 10;
		const sf = this.props.params.sf;
		const sl = this.props.params.sl;
		const dr = this.props.params.dr;
		const s = this.props.params.s;

		//populate the field category
		let fieldCategory = [];

		if(fc) {
            // split field selected parameters.
            let selectedFields = [];
            fc.split('|').forEach(function(field){
                selectedFields.push(field);
            });

			const tmp = this.state.collectionConfig.getMetadataFieldCategories();
			let currentSelectedfields= [];

            selectedFields.map(selField => {
				tmp.map(fieldsArray => {
					if( fieldsArray.id == selField){
                        currentSelectedfields.push(fieldsArray)
					}
				})
            });
            //console.debug(currentSelectedfields)
            fieldCategory = currentSelectedfields;
		}

		//populate the facets
		const selectedFacets = {};
		if(sf) {
			const tmp = sf.split(',');
			tmp.forEach((aggr) => {
				const a = aggr.split('|');
				const key = a[0];
				const value = a[1];
				if(selectedFacets[key]) {
					selectedFacets[key].push(value);
				} else {
					selectedFacets[key] = [value];
				}
			});
		}

		//populate the search layers
		let searchLayers = []
		if(sl) {
			searchLayers = sl.split(',');
		}

		//populate the date range TODO think of a way to include min/max :s
		let dateRange = null;
		if(dr) {
			const tmp = dr.split('__');
			if(tmp.length == 3) {
				dateRange = {
					field : tmp[0],
					start : parseInt(tmp[1]),
					end : parseInt(tmp[2])
				}
			}
		}

		//populate the sort
		let sortParams = null;
		if(s) {
			const tmp = s.split('__');
			if(tmp.length == 2) {
				sortParams = {
					field : tmp[0],
					order : tmp[1]
				}
			}
		}

		return {
			'searchTerm' : searchTerm,
			'fieldCategory' : fieldCategory,
			'selectedFacets' : selectedFacets,
			'searchLayers' : searchLayers,
			'from' : parseInt(fr),
			'pageSize' : parseInt(size),
			'recipeId' : this.props.recipe.id,
			'dateRange' : dateRange,
			'sortParams' : sortParams
		}
	}

	/* ------------------------------------------------------------------------------
	------------------------------- SEARCH RELATED FUNCTIONS --------------------
	------------------------------------------------------------------------------- */

	//FIXME this function is tied to the function returned by the search component (which is kind of weird, but works)
	gotoPage(queryId, pageNumber) {
		if(this.state.currentOutput) {
			const sr = this.state.currentOutput;
			SearchAPI.search(
				queryId,
				sr.collectionConfig,
				sr.params.searchLayers,
				sr.params.term,
				sr.params.fieldCategory,
				sr.params.desiredFacets,
				sr.params.selectedFacets,
				sr.params.dateRange,
				sr.params.sort,
				(pageNumber-1) * this.state.pageSize, //adjust the offset to reflect the intended page
				this.state.pageSize,
				this.onSearched.bind(this),
				true
			)
		}
	}

	//the sortMode is translated to sort params inside the QueryBuilder component
	//sortMode = {type : date/rel, order : desc/asc}
	sortResults(queryId, sortParams) {
		if(this.state.currentOutput) {
			const sr = this.state.currentOutput;
			SearchAPI.search(
				queryId,
				sr.collectionConfig,
				sr.params.searchLayers,
				sr.params.term,
				sr.params.fieldCategory,
				sr.params.desiredFacets,
				sr.params.selectedFacets,
				sr.params.dateRange,
				sortParams, //use the new sort params
				0,
				this.state.pageSize,
				this.onSearched.bind(this),
				true
			)
		}
	}

	/* ------------------------------------------------------------------------------
	------------------------------- TABLE ACTION FUNCTIONS --------------------
	------------------------------------------------------------------------------- */

	toggleRows() {
		let rows = this.state.selectedRows;
		if(this.state.allRowsSelected) {
			rows = {};
		} else {
			this.state.currentOutput.results.forEach((result) => {
				rows[result._id] = !this.state.allRowsSelected;
			});
		}
		this.setState({
			allRowsSelected : !this.state.allRowsSelected,
			selectedRows : rows
		});
	}

	onProjectChanged(project) {
		ComponentUtil.storeJSONInLocalStorage('activeProject', project)
		ComponentUtil.hideModal(this, 'showProjectModal', 'project__modal', true, () => {
			if(this.state.awaitingProcess) {
				switch(this.state.awaitingProcess) {
					case 'bookmark' : this.selectBookmarkGroup(); break;
					case 'saveQuery' : this.saveQueryToProject(); break;
				}
			}
		});
	}

	//this will first check if a project was selected. Then either bookmarks or opens the project selector first
	bookmark() {
		if(this.state.activeProject == null) {
			this.setState({
				showProjectModal : true,
				awaitingProcess : 'bookmark'
			});
		} else {
			this.selectBookmarkGroup();
		}
	}

	//this will actually save the selection to the workspace API
	selectBookmarkGroup() {
		this.setState({
			showBookmarkModal : true,
			awaitingProcess : null
		});
	}

	//finally after a bookmark group is selected, save the bookmark
	bookmarkToGroupInProject(annotation) {
		console.debug(annotation);
		ComponentUtil.hideModal(this, 'showBookmarkModal', 'bookmark__modal', true, () => {
			//concatenate the
			let targets = annotation.target.concat(this.state.currentOutput.results
				.filter((result) => this.state.selectedRows[result._id]) //only include selected resources
				.map((result) => AnnotationUtil.generateSimpleResourceTarget(
					result._id, this.state.collectionConfig.collectionId
				), this))

			let temp = {};
			let dedupedTargets = [];
			targets.forEach((t) => {
				if(!temp[t.source]) {
					temp[t.source] = true;
					dedupedTargets.push(t);
				}
			})
			//set the deduped targets as the annotation target
			annotation.target = dedupedTargets;
			console.debug('THESE BOOKMARKS WILL BE SAVED', annotation);
			//TODO implement saving the bookmarks in the workspace API
			AnnotationAPI.saveAnnotation(annotation, this.onSaveBookmarks.bind(this));
		});
	}

	onSaveBookmarks(data) {
		console.debug('Saved bookmarks', data);
		this.setState({
			selectedRows : {},
			allRowsSelected : false
		}, () => {
			alert('bookmarks were saved successfully I guess')
		})
	}

	saveQuery() {
		if(this.state.activeProject == null) {
			this.setState({
				showProjectModal : true,
				awaitingProcess : 'saveQuery'
			});
		} else {
			this.saveQueryToProject();
		}
	}

	saveQueryToProject() {
		alert('TODO: Save query to the workspace API');
		this.setState({
			awaitingProcess : null
		});
	}

	render() {
		let chooseCollectionBtn = null; // for changing the collection
		let chooseProjectBtn = null; // for changing the active project
		let collectionModal = null; //modal that holds the collection selector
		let projectModal = null;
		let bookmarkModal = null;
		let searchComponent = null; //single search, comparative search or combined search

		//search results, paging and sorting
		let resultList = null;
		let tableActionControls = null;
		let paging = null;
		let sortButtons = null;
		let actionButtons = null;

		if(this.props.recipe.ingredients.collectionSelector) {
			//show the button to open the modal
			chooseCollectionBtn = (
				<button className="btn btn-primary" onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
					Set collection ({
						this.state.collectionConfig ?
							this.state.collectionConfig.collectionInfo.title || null :
							'none selected'
					})
				</button>
			)

			//collection modal
			if(this.state.showModal) {
				collectionModal = (
					<FlexModal
						elementId="collection__modal"
						stateVariable="showModal"
						owner={this}
						size="large"
						title="Choose a collection">
							<CollectionSelector
								onOutput={this.onComponentOutput.bind(this)}
								showSelect={true}
								showBrowser={true}/>
					</FlexModal>
				)
			}
		}

		chooseProjectBtn = (
			<button className="btn btn-primary" onClick={ComponentUtil.showModal.bind(this, this, 'showProjectModal')}>
				Set project ({this.state.activeProject ? this.state.activeProject.name : 'none selected'})
			</button>
		)

		//project modal
		if(this.state.showProjectModal) {
			projectModal = (
				<FlexModal
					elementId="project__modal"
					stateVariable="showProjectModal"
					owner={this}
					size="large"
					title="Set the active project">
						<ProjectSelector onOutput={this.onComponentOutput.bind(this)} user={this.props.user}/>
				</FlexModal>
			)
		}

		//bookmark modal
		if(this.state.showBookmarkModal) {
			bookmarkModal = (
				<FlexModal
					elementId="bookmark__modal"
					stateVariable="showBookmarkModal"
					owner={this}
					size="large"
					title="Select or enter a bookmark group">
						<BookmarkSelector
							onOutput={this.onComponentOutput.bind(this)}
							user={this.props.user}
							project={this.state.activeProject}
							collectionId={this.state.collectionConfig.collectionId}
							/>
				</FlexModal>
			)
		}

		//only draw when a collection config is properly loaded
		if(this.state.collectionConfig) {
			if(this.state.collectionId) {
				//this components outputs: search results, aggregations & sorting & paging functions!
				searchComponent = (<QueryBuilder
					key={this.state.collectionId} //for resetting all the states held within after selecting a new collection
					queryId={'single__query'}
					aggregationView={this.props.recipe.ingredients.aggregationView}
					pageSize={this.state.pageSize}
					dateRangeSelector={this.props.recipe.ingredients.dateRangeSelector}
					collectionConfig={this.state.collectionConfig}
					searchAPI={_config.SEARCH_API_BASE}
					searchParams={this.extractSearchParams()} //FIXME these are actually only used once in the init, should be changed!
					onOutput={this.onComponentOutput.bind(this)}
					header={true}/>);
			}

			//draw the search hits in here, so it's possible to put the linechart in between the search box and the results
			if(this.state.currentOutput && this.state.currentOutput.results && this.state.currentOutput.results.length > 0) {
				//populate the paging buttons
				if(this.state.currentOutput.currentPage > 0) {
					paging = <Paging
						currentPage={this.state.currentOutput.currentPage}
						numPages={Math.ceil(this.state.currentOutput.totalHits / this.state.pageSize)}
						gotoPage={this.gotoPage.bind(this)}/>
				}

				if(this.state.currentOutput.params.sort) {
					//draw the sorting buttons
					sortButtons = <Sorting
						sortResults={this.sortResults.bind(this)}
						sortParams={this.state.currentOutput.params.sort}
						collectionConfig={this.state.collectionConfig}
						dateField={this.state.currentOutput.dateField}/>
				}

				tableActionControls = (
					<div className={IDUtil.cssClassName('select', this.CLASS_PREFIX)}
						onClick={this.toggleRows.bind(this)}>
						<input type="checkbox" checked={
							this.state.allRowsSelected ? 'checked' : ''
						} id={'cb__select-all'}/>
						<label for={'cb__select-all'}><span></span></label>
					</div>
				)

				//draw the action buttons
				const actions = [];

				//always add the save query button
				actions.push(
					<button
						type="button"
						className="btn btn-primary"
						onClick={this.saveQuery.bind(this)}
						title="Save current query to project"
						>
						&nbsp;
						<i className="fa fa-save" style={{color: 'white'}}></i>
						&nbsp;
					</button>
				);
				if(Object.keys(this.state.selectedRows).length > 0) {
					actions.push(
						<button
							type="button"
							className="btn btn-primary"
							onClick={this.bookmark.bind(this)}
							title="Bookmark selection to project"
							>
							&nbsp;
							<i className="fa fa-star" style={{color: 'white'}}></i>
							&nbsp;
						</button>
					);
				}
				actionButtons = (
					<div className={IDUtil.cssClassName('table-actions', this.CLASS_PREFIX)}>
						{actions}
					</div>
				)

				//populate the list of search results
				const items = this.state.currentOutput.results.map((result, index) => {
					return (
						<SearchHit
							key={'__' + index}
							result={result}
							searchTerm={this.state.currentOutput.params.term} //for highlighting the search term
							dateField={this.state.currentOutput.dateField} //for displaying the right date field in the hits
							collectionConfig={this.state.collectionConfig}
							itemDetailsPath={this.props.recipe.ingredients.itemDetailsPath}
							isSelected={this.state.selectedRows[result._id]} //is the result selected
							onOutput={this.onComponentOutput.bind(this)}/>
					)
				}, this);
				resultList = (
					<div className="row">
						<div className="col-md-12">
							<div className={IDUtil.cssClassName('table-actions-header', this.CLASS_PREFIX)}>
								{tableActionControls}
								{actionButtons}
								<div style={{textAlign : 'center'}}>
									{paging}
									<div style={{float: 'right'}}>
										{sortButtons}
									</div>
								</div>
							</div>
							{items}
							<div className={IDUtil.cssClassName('table-actions-footer', this.CLASS_PREFIX)}>
								{paging}
							</div>
						</div>
					</div>
				)
			}
		}

		return (
			<div className={IDUtil.cssClassName('single-search-recipe')}>
				<div className="row">
					<div className="col-md-12">
						{chooseCollectionBtn}&nbsp;{chooseProjectBtn}
						{collectionModal}
						{projectModal}
						{bookmarkModal}
						{searchComponent}
					</div>
				</div>
				{resultList}
			</div>
		);
	}
}

export default SingleSearchRecipe;