import CollectionSelector from './components/collection/CollectionSelector';
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
import SearchAPI from './api/SearchAPI';

class SingleSearchRecipe extends React.Component {
	constructor(props) {
		super(props);
		const user = this.props.user || 'JaapTest';
		let collectionId = null;
		if(this.props.params.cids) {
			collectionId = this.props.params.cids.split(',')[0];
		} else {
			collectionId = this.props.recipe.ingredients.collection;
		}
		this.state = {
			user : user,
			collectionId : collectionId,
			pageSize : 20,
			collectionConfig : null
		};
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
		}
	}

	onCollectionChange(collectionConfig) {
		ComponentUtil.hideModal(this, 'showModal', 'collection__modal', true)
		this.setBrowserHistory(null, null, 0, this.state.pageSize, null, null, null, null, collectionConfig.collectionId);
	}

	onSearched(data) {
		this.setState({
			currentOutput: data
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


		if(fieldCategory && fieldCategory.id) {
			params['fc'] = fieldCategory.id;
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
		let fieldCategory = null;
		if(fc) {
			const tmp = this.state.collectionConfig.getMetadataFieldCategories();
			if(tmp) {
				fieldCategory = tmp.filter((f) => {
					return f.label == fc;
				})
				fieldCategory = fieldCategory.length == 1 ? fieldCategory[0] : null;
			}
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
					start : tmp[1],
					end : tmp[2]
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

	render() {
		let chooseCollectionBtn = null; // for changing the collection
		let collectionModal = null; //modal that holds the collection selector
		let searchComponent = null; //single search, comparative search or combined search

		//search results, paging and sorting
		let resultList = null;
		let paging = null;
		let sortButtons = null;

		if(this.props.recipe.ingredients.collectionSelector) {
			//show the button to open the modal
			chooseCollectionBtn = (
				<button className="btn btn-primary" onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
					Select collection
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
						title="Select a collection">
							<CollectionSelector
								onOutput={this.onComponentOutput.bind(this)}
								showSelect={true}
								showBrowser={true}/>
					</FlexModal>
				)
			}
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
						dateField={this.state.currentOutput.dateField}/>
				}

				//populate the list of search results
				const items = this.state.currentOutput.results.map((result, index) => {
					return (
						<SearchHit
							key={'__' + index}
							result={result}
							searchTerm={this.state.currentOutput.params.term} //for highlighting the search term
							dateField={this.state.currentOutput.dateField} //for displaying the right date field in the hits
							collectionConfig={this.state.collectionConfig}
							itemDetailsPath={this.props.recipe.ingredients.itemDetailsPath}/>
					)
				}, this);
				resultList = (
					<div className="row">
						<div className="col-md-12">
							{paging}&nbsp;{sortButtons}
							{items}
							{paging}
						</div>
					</div>
				)
			}
		}

		return (
			<div className={IDUtil.cssClassName('single-search-recipe')}>
				<div className="row">
					<div className="col-md-12">
						{chooseCollectionBtn}
						{collectionModal}
						{searchComponent}
					</div>
				</div>
				{resultList}
			</div>
		);
	}
}

export default SingleSearchRecipe;