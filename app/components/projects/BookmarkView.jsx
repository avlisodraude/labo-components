import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';

import AnnotationStore from '../../flux/AnnotationStore';
import AnnotationUtil from '../../util/AnnotationUtil';

import BookmarkRow from './BookmarkRow';
import { exportDataAsJSON } from '../helpers/Export';
import ItemDetailsRecipe from '../../ItemDetailsRecipe';

class BookmarkView extends React.PureComponent {

  constructor(props) {
    super(props);
    /*
    let placeholderData =[
      {
        // unique bookmark id, used for referencing
        id: "unique-bookmark-id-12345",

        // general object (document,fragment,entity) data
        object:{

          // unique object id
          id: "openbeelden-video-10201",

          // object type: "Video", Video-Fragment", "Image", "Audio", "Entity", ...
          type: "Video",

          // short object title
          title: "Polygoonjournaal 1953-02-05 20:00",

          // (Creation) date of the object (nice to have)
          date: "1953-02-05T20:00:00Z",

          // dataset the object originates from
          dataset: "Beeld en Geluid : Open Beelden",

          // placeholder image if available
          placeholderImage: "https://www.openbeelden.nl/images/603292/Internationale_hondententoonstelling_%280_32%29.png"

        },

        // Bookmark created
        created: "2017-02-20T10:04:45Z",

        // sort position
        sort: 1,

        // optional list of annotations here
        // (could also be requested in separate calls)
        annotations:[],
      },
      {
        id: "unique-bookmark-id-12344",
        object:{
          id: "niod-image-192929",
          type: "Image",
          title: "Example image",
          date: "1964-05-01T00:00:00Z",
          dataset: "NIOD",
          placeholderImage: "https://www.openbeelden.nl/images/789580/Schuttersgilde_sint_sebastiaan_bestaat_500_jaar_%280_42%29.png"
        },
        created: "2017-02-20T10:04:40Z",
        sort: 2,
        annotations:[ ]
      },
      {
        id: "unique-bookmark-id-12346",
        object:{
          id: "dive-entity-99111",
          type: "Entity",
          title: "Example entity",
          date: "1964-05-01T00:00:00Z",
          dataset: "VU: DIVE+",
          placeholderImage: "https://www.openbeelden.nl/images/689885/Sport_instuif_voor_het_hele_gezin_%280_44%29.png"
        },
        created: "2017-02-20T10:04:40Z",
        sort: 3,
        annotations:[ ]
      }

    ];*/


    this.state = {
      bookmarks: [],
      filteredBookmarks: [],
      visibleBookmarks: [],
      loading : true,
      filter:{
        keywords: '',
        type: '',
      },
      order: 'created',
      itemDetail: null 
    }

    // binded functions
    this.viewBookmark = this.viewBookmark.bind(this);
    this.deleteBookmark = this.deleteBookmark.bind(this);

  }

  componentDidMount() {
    this.loadBookmarks();
  }

  /**
   * Load Annotation from Store
   * (todo) -- rename to bookmarks
   */
  loadBookmarks() {
    AnnotationStore.getUserProjectAnnotations(
      this.props.user,
      this.props.project,
      this.onLoadBookmarks.bind(this)
    )
  }

  /**
   * Annotation load callback: set data to state
   * @param  {Object} data Response object with annotation list
   */
  onLoadBookmarks(data) {
    const bookmarks = AnnotationUtil.nestedAnnotationListToResourceList(
      data.annotations || []
    )


    // filter
    let filtered = this.filterBookmarks(bookmarks,this.state.filter);

    // sort
    let sorted = this.sortBookmarks(filtered, this.state.order);


    // //TODO @Werner je kunt deze gebruiken in de annotation-centric view
    // const annotations = AnnotationUtil.nestedAnnotationListToAnnotationList(
    //   data.annotations || []
    // )
    // console.debug(annotations)


    this.setState({
      bookmarks: bookmarks,
      filteredBookmarks: filtered,
      visibleBookmarks: sorted,
      loading : false
    });
  }


  /**
   * Load and filter data
   */
  reloadData(){
    // filter
    let filtered = this.filterBookmarks(this.state.bookmarks,this.state.filter);

    // sort
    let sorted = this.sortBookmarks(filtered, this.state.order);

    // update state
    this.setState({
      filteredBookmarks: filtered,
      visibleBookmarks: sorted,
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
                                                  || bookmark.object.dataset.toLowerCase().includes(k)
                                                  || bookmark.object.type.toLowerCase().includes(k)))
      });
    }

    // filter on type
    if (filter.type){
      bookmarks = bookmarks.filter((bookmark)=>(bookmark.object.type.toLowerCase().includes(filter.type)));
    }

    return bookmarks;
  }


  /**
   * Sort bookmarks by the given field
   * @param {string} field Unique sort field   
   */
  setSort(field){

    this.setState({
      order: field,

      // filter list from original bookmarks to keep sort list consistent
      visibleBookmarks: this.sortBookmarks(this.state.filteredBookmarks, field)
    });

  }

  /** 
   * Sort bookmarks 
   * @param {Array} bookmarks List of bookmarks to be sorted
   * @param {string} sort Sort field   * 
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
   * Listen for update, request new data if filter has been changed
   */
  componentDidUpdate(){
    if (this.lastFilter !== this.state.filter){
      this.lastFilter = this.state.filter;

      // throttle data requests
      clearTimeout(this.requestDataTimeout);
      this.requestDataTimeout = setTimeout(this.reloadData.bind(this), 500);
    }
  }

  /**
   * Keywords filter changes
   * @param {SyntheticEvent} e Event
   */
  keywordsChange(e){
    this.setState({
        filter: Object.assign({}, this.state.filter, {
        keywords: e.target.value
      })
    });
  }

  /**
   * Type filter changes
   * @param {SyntheticEvent} e Event
   */
  typeChange(e){
    this.setState({
        filter: Object.assign({}, this.state.filter, {
        type: e.target.value
      })
    });
  }


  /**
   * Delete bookmark
   * @param {Object} bookmark Bookmark to be removed
   */
  deleteBookmark(bookmark){
    alert('Todo: Implement delete');
  }


  /**
   * View bookmark
   * @param {Object} bookmark Bookmark to be viewed
   */
  viewBookmark(bookmark){
    this.setState({
      itemDetail: bookmark
    })
  }

  /**
   * Sort change
   * @param {string} sort Sort name
   */
  sortChange(e){
    this.setSort(e.target.value);
  }


  render(){
    return (
      <div className={IDUtil.cssClassName('bookmark-view')}>
        <div className="tools">
          <div className="export-button btn primary" onClick={exportDataAsJSON.bind(this,this.state.bookmarks)}>Export</div>

          <div className="filters">
            <div className="left">

              <h3>Filters</h3>

              <input className="search"
                     type="text"
                     placeholder="Search"
                     value={this.state.filter.keywords}
                     onChange={this.keywordsChange.bind(this)}
                     />

              <label className="type-label">Type</label>

              <select className="type-select" value={this.state.type} onChange={this.typeChange.bind(this)}>
                 {/* todo: dynamically disable/enable options based on set? */}
                 <option></option>
                 <option value="video">Video</option>
                 <option value="fragment">Fragment</option>
                 <option value="image">Image</option>
                 <option value="audio">Audio</option>
                 <option value="entity">Entity</option>
              </select>

            </div>

            <div className="right">

              <h3>Order</h3>

              <select value={this.state.order} onChange={this.sortChange.bind(this)}>
                <option value="created">Bookmark created</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-az">Title A-Z</option>
                <option value="name-za">Title Z-A</option>
                <option value="type">Type</option>
                <option value="dataset">Dataset</option>
                <option value="manual">Manual</option>
              </select>

            </div>
          </div>
        </div>

        <div className="results">
          <h3><input type="checkbox"/>Bookmarks: <span className="count">{this.state.visibleBookmarks.length || 0}</span></h3>

          <div className="table">
            {this.state.visibleBookmarks.map((bookmark, index)=>(
              <BookmarkRow key={index} 
                           bookmark={bookmark} 
                           onDelete={this.deleteBookmark}
                           onView={this.viewBookmark}
                           />
              ))}           
          </div>
      </div>

      {this.state.itemDetail ? 
        /* todo: display item details recipe in overlay */
        <div className="modal">
          <div className="close" onClick={()=>{this.viewBookmark(null);}} />
          <div className="container">
            Todo: ItemDetailsRecipe here.<br/><br/>
            {"<ItemDetailsRecipe item={this.state.itemDetail} />"}
            <br/><br/>
          </div>
        </div>
        : null
      }
  </div>
  )
  }
}

export default BookmarkView;