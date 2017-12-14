import AnnotationStore from '../../flux/AnnotationStore';
import AnnotationUtil from '../../util/AnnotationUtil';
import BookmarkRow from './BookmarkRow';
import BookmarkTable from './BookmarkTable';
import ComponentUtil from '../../util/ComponentUtil';
import IDUtil from '../../util/IDUtil';
import ItemDetailsModal from './ItemDetailsModal';
import ProjectAPI from '../../api/ProjectAPI';
import ProjectWrapper from './ProjectWrapper';
import PropTypes from 'prop-types';
import { exportDataAsJSON } from '../helpers/Export';

class BookmarkView extends React.PureComponent {

  constructor(props) {
    super(props);

    this.bookmarkTypes = ["Video", "Video-Fragment", "Image", "Audio", "Entity"];

    this.orders = [
            {value:"created", name:"Bookmark created"},
            {value:"newest", name:"Newest objects first"},
            {value:"oldest", name:"Oldest objects first"},
            {value:"name-az", name:"Title A-Z"},
            {value:"name-za", name:"Title Z-A"},
            {value:"type", name:"Type"},
            {value:"dataset", name:"Dataset"},
            {value:"manual", name:"Manual"},
            ];

    this.state = {
      bookmarks: [],
      selection: [],
      loading : true,
      detailBookmark: null,
      filters: []
    }

    // bind functions
    this.viewBookmark = this.viewBookmark.bind(this);
    this.deleteBookmark = this.deleteBookmark.bind(this);

    this.filterBookmarks = this.filterBookmarks.bind(this);
    this.sortBookmarks = this.sortBookmarks.bind(this);
    this.renderResults = this.renderResults.bind(this);

    this.selectAllChange = this.selectAllChange.bind(this);
    this.selectBookmark = this.selectBookmark.bind(this);

    this.closeItemDetails = this.closeItemDetails.bind(this);
  }

  componentWillMount() {
    this.loadBookmarks();
  }

  /**
   * Load Annotation from Store
   */
  loadBookmarks() {
    AnnotationStore.getUserProjectAnnotations(
      this.props.user,
      this.props.project,
      this.onLoadBookmarks.bind(this)
    )
  }

  /**
   * Get filter list of unique object types
   * @param  {array} items List of bookmarks
   * @return {array}       List of filters
   */
  getFilters(items){

    let result = [];
    let hits = {};

    items.forEach((item)=>{
      var t = item.object.type;
      if (!(t in hits)){
        result.push( {value: t, name: t.charAt(0).toUpperCase() + t.slice(1)},);
        hits[t] = true;
      }
    });
    return result.sort();
  }


  /**
   * Annotation load callback: set data to state
   * @param  {Object} data Response object with annotation list
   */
  onLoadBookmarks(data) {
    AnnotationUtil.nestedAnnotationListToResourceList(
      data.annotations || [],
      this.onLoadResourceList.bind(this)
    )
  }

  /**
   * The resource list now also contains the data of the resources
   * @param  {array} bookmarks Full bookmark data
   */
  onLoadResourceList(bookmarks) {
    this.setState({
      bookmarks: bookmarks,
      loading : false,
      selection: [],
      filters: this.getFilters(bookmarks),
    });
  }

  /**
   * Filter bookmark list by given filter
   * @param  {array} bookmarks  Bookmarks array
   * @param  {object} filter    Filter object
   * @return {array}            Filtered bookmarks array
   */
  filterBookmarks(bookmarks, filter){

    // filter on keywords in title, dataset or type
    if (filter.keywords){
      let keywords = filter.keywords.split(" ");
      keywords.forEach((k)=>{
        k = k.toLowerCase();
        bookmarks = bookmarks.filter((bookmark)=>(bookmark.object.title.toLowerCase().includes(k)
                                                  || (bookmark.object.dataset && bookmark.object.dataset.toLowerCase().includes(k))
                                                  || (bookmark.object.type && bookmark.object.type.toLowerCase().includes(k))))
      });
    }

    // filter on type
    if (filter.type){
      bookmarks = bookmarks.filter((bookmark)=>(bookmark.object.type.toLowerCase().includes(filter.type.toLowerCase())));
    }

    return bookmarks;
  }

  /**
   * Sort bookmarks
   * @param {Array} bookmarks List of bookmarks to be sorted
   * @param {string} sort Sort field
   * @return {Array} Sorted bookmarks
   */
  sortBookmarks(bookmarks, field){
   let sorted = bookmarks;
   switch(field){
    case 'created':
      sorted.sort((a,b) => (a.created > b.created));
    break;
    case 'newest':
      sorted.sort((a,b) => (a.object.date < b.object.date));
    break;
    case 'oldest':
      sorted.sort((a,b) => (a.object.date > b.object.date));
    break;
    case 'name-az':
      sorted.sort((a,b) => (a.object.title > b.object.title));
    break;
    case 'name-za':
      sorted.sort((a,b) => (a.object.title < b.object.title));
    break;
    case 'type':
      sorted.sort((a,b) => (a.object.type > b.object.type));
    break;
    case 'dataset':
      sorted.sort((a,b) => (a.object.dataset > b.object.dataset));
    break;
    case 'manual':
      sorted.sort((a,b) => (a.sort > b.sort));
    break;
    default:
      // no sorting,just return
      return sorted;
   }

   return sorted;

  }


  /**
   * Delete bookmark
   * @param {Object} bookmark Bookmark to be removed
   */
  deleteBookmark(bookmark){
    alert('Todo: Implement delete');
  }


  /**
   * Make current project active
   */
  makeActiveProject(){
    ComponentUtil.storeJSONInLocalStorage('activeProject', this.props.project);  
  }

  /**
   * View bookmark
   * @param {Object} bookmark Bookmark to be viewed
   */
  viewBookmark(bookmark){
    // make current project active
    if (bookmark){    
      this.makeActiveProject();
    }    
    this.setState({
      detailBookmark: bookmark
    })
  }

  /**
   * Sort change
   * @param {string} sort Sort name
   */
  sortChange(e){
    this.setSort(e.target.value);
  }


  /**
   * Select all items
   */
  selectAllChange(items, e){
    if (e.target.checked){
      let newSelection = this.state.selection.slice();
      items.forEach((item)=>{ if(!newSelection.includes(item)){ newSelection.push(item)}});
      // set
      this.setState({
        selection: newSelection
      });
    } else{
      // unset
      this.setState({
        selection: this.state.selection.filter((item)=>(!items.includes(item)))
      });
    }

  }

  /**
   * Select bookmark
   */
  selectBookmark(bookmark, select){
    if (select){

      if(!this.state.selection.includes(bookmark)){
        // add to selection
        this.setState({
          selection: [...this.state.selection, bookmark]
        });
      }
      return;
    }

    // remove from selection
    if (!select){
      this.setState({
        selection: this.state.selection.filter((selected)=>(selected!== bookmark))
      });
    }
  }
  
  /**
   * Close itemDetails view, and refresh the data (assuming changes have been made)
   */
  closeItemDetails(){
    // set viewbookmark to null
    this.viewBookmark(null);

    // refresh data
    this.loadBookmarks();
  }

  /**
   * Renders the results in the BookmarkTable component
   * @param {object} state State of the render component
   * @return {Element} View results
   */
  renderResults(renderState){
    return (
      <div>
        <h2>
          <input type="checkbox"
                 checked={renderState.visibleItems.length > 0 && renderState.visibleItems.every((item)=>(this.state.selection.includes(item))) }
                 onChange={this.selectAllChange.bind(this, renderState.visibleItems)}
                />
          Bookmarks: <span className="count">{renderState.visibleItems.length || 0}</span>
        </h2>
        <div className="bookmark-table">
          {renderState.visibleItems.map((bookmark, index)=>(
            <BookmarkRow key={index}
                         bookmark={bookmark}
                         onDelete={this.deleteBookmark}
                         onView={this.viewBookmark}
                         selected={this.state.selection.includes(bookmark)}
                         onSelect={this.selectBookmark}
                         />
            ))}
        </div>
      </div>
      );
  }

  render(){
    return (
      <div className={IDUtil.cssClassName('bookmark-view')}>
        <BookmarkTable
          items={this.state.bookmarks}          
          sortItems={this.sortBookmarks}
          orders={this.orders}
          filterItems={this.filterBookmarks}
          filters={this.state.filters}
          renderResults={this.renderResults}
          onExport={exportDataAsJSON}
          />

        {this.state.detailBookmark ?
          <ItemDetailsModal object={this.state.detailBookmark.object}
                            onClose={this.closeItemDetails} />
        
        : null}
  </div>
  )
  }
}


BookmarkView.propTypes = {
  user: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired
}



export default BookmarkView;