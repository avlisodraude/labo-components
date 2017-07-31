import IDUtil from './util/IDUtil';
import ComponentUtil from './util/ComponentUtil';
import FlexModal from './components/FlexModal';
import CollectionSelector from './components/collection/CollectionSelector';
import FlexRouter from './util/FlexRouter';
import QueryBuilder from './components/search/QueryBuilder';
import Paging from './components/search/Paging';
import Sorting from './components/search/Sorting';
import SearchHit from './components/search/SearchHit';
import SearchAPI from './api/SearchAPI';

class SingleCollectionQueryRecipe extends React.Component {
    constructor(props) {

        super(props);

        let user = this.props.user || 'Eduardo';
        let collectionId = null;

        if (this.props.params.cids) {
            collectionId = this.props.params.cids.split(',')[0];
        } else {
            collectionId = this.props.recipe.ingredients.collection;
        }
        this.state = {
            user: user,
            collectionId: collectionId,
            pageSize: 20,
            collectionConfig: null
        };
    }

    //Used for initialising listeners or obtaining data (asynchronously) for your recipe
    componentDidMount() {
        // CollectionUtil.generateCollectionConfig(this.state.collectionId, this.onLoadCollectionConfig.bind(this), true);
    }

    onLoadCollectionConfig(config) {
        this.setState({collectionConfig: config});
    }

    //this function receives all output of components that generate output and orchestrates where
    //to pass it to based on the ingredients of the recipe
    //TODO change this, so it knows what to do based on the recipe
    onComponentOutput(componentClass, data) {
        if (componentClass == 'QueryBuilder') {
            this.onSearched(data);
        } else if (componentClass == 'CollectionSelector') {
            this.setState({
                    collectionId: data.collectionId,
                    collectionConfig: data,
                    currentOutput: null
                },
                this.onCollectionChange(data)
            );
        }
    }

    // runs once a collection/organization has been selected in the modal
    onCollectionChange(collectionConfig) {
        ComponentUtil.hideModal(this, 'showModal', 'collection__modal', true)
        this.setBrowserHistory(null, 0, this.state.pageSize, {}, null, null, null, collectionConfig.collectionId);
    }

    onSearched(data) {
        if (data && data.params && data.updateUrl) {

            this.setBrowserHistory(
                data.params.term,
                data.params.offset,
                data.params.size,
                data.params.selectedFacets,
                data.params.dateRange,
                data.params.sort,
                data.params.searchLayers,
                data.collectionConfig.getSearchIndex()
            );
        }

        this.setState({
            currentOutput: data
        });
    }

    componentWillMount() {
    }

    //Try to avoid using this one. Sometimes it is needed, but it usually ain't pretty
    componentDidUpdate() {
    }

    setBrowserHistory(searchTerm, offset, pageSize, selectedFacets, dateRange, sortParams, searchLayers, collection) {
        let sf = [];
        if (selectedFacets) {
            sf = Object.keys(selectedFacets).map((key) => {
                return selectedFacets[key].map((value) => {
                    return key + '|' + value;
                })
            });
        }
        let params = {
            st: searchTerm,
            sf: sf.join(','),
            fr: offset,
            sz: pageSize,
            cids: collection
        }

        if (dateRange) {
            let dr = dateRange.field + '__';
            dr += dateRange.start + '__';
            dr += dateRange.end;
            params['dr'] = dr;
        }
        if (sortParams) {
            let s = sortParams.field + '__';
            s += sortParams.order;
            params['s'] = s;
        }

        if (searchLayers) {
            let sl = Object.keys(searchLayers).filter((l) => {
                return searchLayers[l];
            });
            if (sl.length > 0) {
                params['sl'] = sl.join(',');
            }
        }

        FlexRouter.setBrowserHistory(
            params, //will also be stored in the browser state (cannot exceed 640k chars)
            this.constructor.name //used as the title for the state
        )
    }

    extractSearchParams() {
        if (this.props.params && Object.keys(this.props.params).length == 0) {
            return null;
        }

        var searchTerm = this.props.params.st ? this.props.params.st : '';
        var fr = this.props.params.fr ? this.props.params.fr : 0;
        var size = this.props.params.sz ? this.props.params.sz : 10;
        var sf = this.props.params.sf;
        var sl = this.props.params.sl;
        var dr = this.props.params.dr;
        var s = this.props.params.s;

        //populate the facets
        var selectedFacets = {};
        if (sf) {
            let tmp = sf.split(',');
            tmp.forEach((aggr) => {
                let a = aggr.split('|');
                let key = a[0];
                let value = a[1];
                if (selectedFacets[key]) {
                    selectedFacets[key].push(value);
                } else {
                    selectedFacets[key] = [value];
                }
            });
        }

        //populate the search layers
        var searchLayers = []
        if (sl) {
            searchLayers = sl.split(',');
        }

        //populate the date range TODO think of a way to include min/max :s
        var dateRange = null;
        if (dr) {
            let tmp = dr.split('__');
            if (tmp.length == 3) {
                dateRange = {
                    field: tmp[0],
                    start: tmp[1],
                    end: tmp[2]
                }
            }
        }

        //populate the sort
        var sortParams = null;
        if (s) {
            let tmp = s.split('__');
            if (tmp.length == 2) {
                sortParams = {
                    field: tmp[0],
                    order: tmp[1]
                }
            }
        }

        return {
            'searchTerm': searchTerm,
            'selectedFacets': selectedFacets,
            'searchLayers': searchLayers,
            'from': parseInt(fr),
            'pageSize': parseInt(size),
            'recipeId': this.props.recipe.id,
            'dateRange': dateRange,
            'sortParams': sortParams
        }
    }

    gotoPage(queryId, pageNumber) {
        if (this.state.currentOutput) {

            let sr = this.state.currentOutput;

            SearchAPI.search(
                queryId,
                sr.collectionConfig,
                sr.params.searchLayers,
                sr.params.term,
                sr.params.desiredFacets,
                sr.params.selectedFacets,
                sr.params.dateRange,
                sr.params.sort,
                (pageNumber - 1) * this.state.pageSize, //adjust the offset to reflect the intended page
                this.state.pageSize,
                this.onSearched.bind(this),
                true
            )
        }
    }

    sortResults(queryId, sortParams) {
        if (this.state.currentOutput) {

            let sr = this.state.currentOutput;

            SearchAPI.search(
                queryId,
                sr.collectionConfig,
                sr.params.searchLayers,
                sr.params.term,
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
        let SelectCollectionModal;
        let searchQuery;
        let resultList = null;
        let paging = null;
        let sortButtons = null;

        // once the collection has been selected the query builder will be added to the page.
        if (this.state.collectionConfig) {
            let searchParams = this.extractSearchParams();
            let queryId = IDUtil.guid();

            searchQuery = (
                <QueryBuilder
                    key={this.state.collectionId}
                    queryId={queryId}
                    aggregationView={this.props.recipe.ingredients.aggregationView}
                    pageSize={this.state.pageSize ? this.state.pageSize : 20}
                    dateRangeSelector={this.props.recipe.ingredients.dateRangeSelector}
                    collectionConfig={this.state.collectionConfig}
                    searchAPI={_config.SEARCH_API_BASE}
                    searchParams={searchParams} //TODO when ComparativeSearchRecipe knows how to store all q's in the URL
                    onOutput={this.onComponentOutput.bind(this)}
                    header={true}/>
            );
        }

        if (this.state.showModal) {
            SelectCollectionModal = (
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
            );
        }

        //draw the search hits in here, so it's possible to put the linechart in between the search box and the results
        if (this.state.currentOutput && this.state.currentOutput.results && this.state.currentOutput.results.length > 0) {
            //populate the paging buttons
            if (this.state.currentOutput.currentPage > 0) {
                paging = <Paging
                    currentPage={this.state.currentOutput.currentPage}
                    numPages={Math.ceil(this.state.currentOutput.totalHits / this.state.pageSize)}
                    gotoPage={this.gotoPage.bind(this)}/>
            }

            if (this.state.currentOutput.params.sort) {
                //draw the sorting buttons
                sortButtons = <Sorting
                    sortResults={this.sortResults.bind(this)}
                    sortParams={this.state.currentOutput.params.sort}
                    dateField={this.state.currentOutput.dateField}/>
            }

            //populate the list of search results
            let items = this.state.currentOutput.results.map((result, index) => {
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

        return (
            <div className={IDUtil.cssClassName('single-test-recipe')}>
                <p>
                    {SelectCollectionModal}
                    <button className="btn btn-primary" onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
                        Search Collection
                    </button>
                    {searchQuery}
                </p>
                <div className={IDUtil.cssClassName('search-field', this.CLASS_PREFIX)}>
                    {resultList}
                </div>
            </div>
        )
    }
}

export default SingleCollectionQueryRecipe;