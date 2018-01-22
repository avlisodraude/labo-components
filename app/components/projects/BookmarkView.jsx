import AnnotationAPI from '../../api/AnnotationAPI';
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
import BulkActions from '../helpers/BulkActions';

/**
 * This view handles the loading, filtering and selection of data of
 * the Bookmarks list of a project. It is displayed using the BookmarkTable component.
 */
class BookmarkView extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);

    this.bookmarkTypes = [
      'Video',
      'Video-Fragment',
      'Image',
      'Audio',
      'Entity'
    ];

    this.orders = [
      { value: 'created', name: 'Bookmark created' },
      { value: 'newest', name: 'Newest objects first' },
      { value: 'oldest', name: 'Oldest objects first' },
      { value: 'name-az', name: 'Title A-Z' },
      { value: 'name-za', name: 'Title Z-A' },
      { value: 'type', name: 'Type' },
      { value: 'dataset', name: 'Dataset' },
      { value: 'manual', name: 'Manual' }
    ];

    this.bulkActions = [
      { title: 'Delete', onApply: this.deleteBookmarks.bind(this) },
      { title: 'Export', onApply: this.exportBookmarks.bind(this) }
    ];

    this.state = {
      annotations : null,
      bookmarks: [],
      selection: [],
      loading: true,
      detailBookmark: null,
      filters: []
    };

    // bind functions
    this.viewBookmark = this.viewBookmark.bind(this);
    this.deleteBookmark = this.deleteBookmark.bind(this);

    this.filterBookmarks = this.filterBookmarks.bind(this);
    this.sortBookmarks = this.sortBookmarks.bind(this);
    this.renderResults = this.renderResults.bind(this);

    this.selectAllChange = this.selectAllChange.bind(this);
    this.selectItem = this.selectItem.bind(this);

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
    );
  }

  /**
   * Get filter list of unique object types
   *
   * @param  {array} items List of bookmarks
   * @return {array}       List of filters
   */
  getFilters(items) {
    const result = [];
    const hits = {};

    items.forEach(item => {
      const t = item.object.type;
      if (!(t in hits)) {
        result.push({ value: t, name: t.charAt(0).toUpperCase() + t.slice(1) });
        hits[t] = true;
      }
    });
    return result.sort();
  }

  /**
   * Annotation load callback: set data to state
   *
   * @param  {Object} data Response object with annotation list
   */
  onLoadBookmarks(data) {
    this.setState({
      annotations : data.annotations || null
    }, () => {
      AnnotationUtil.nestedAnnotationListToResourceList(
        data.annotations || [],
        this.onLoadResourceList.bind(this)
      );
    })

  }

  /**
   * The resource list now also contains the data of the resources
   *
   * @param  {array} bookmarks Full bookmark data
   */
  onLoadResourceList(bookmarks) {
    this.setState({
      bookmarks: bookmarks,
      loading: false,
      filters: this.getFilters(bookmarks)
    });

    this.updateSelection(bookmarks);
  }

  /**
   * Update Selection list, based on available items
   *
   * @param  {array} items  Current data
   */
  updateSelection(items) {
    this.setState({
      selection: items
        .map(item => item.id)
        .filter(itemId => this.state.selection.includes(itemId))
    });
  }

  /**
   * Filter bookmark list by given filter
   *
   * @param  {array} bookmarks  Bookmarks array
   * @param  {object} filter    Filter object
   * @return {array}            Filtered bookmarks array
   */
  filterBookmarks(bookmarks, filter) {
    // filter on keywords in title, dataset or type
    if (filter.keywords) {
      const keywords = filter.keywords.split(' ');
      keywords.forEach(k => {
        k = k.toLowerCase();
        bookmarks = bookmarks.filter(
          bookmark =>
            bookmark.object.title.toLowerCase().includes(k) ||
            (bookmark.object.dataset &&
              bookmark.object.dataset.toLowerCase().includes(k)) ||
            (bookmark.object.type &&
              bookmark.object.type.toLowerCase().includes(k))
        );
      });
    }

    // filter on type
    if (filter.type) {
      bookmarks = bookmarks.filter(bookmark =>
        bookmark.object.type.toLowerCase().includes(filter.type.toLowerCase())
      );
    }

    return bookmarks;
  }

  /**
   * Sort bookmarks
   *
   * @param {Array} bookmarks List of bookmarks to be sorted
   * @param {string} sort Sort field
   * @return {Array} Sorted bookmarks
   */
  sortBookmarks(bookmarks, field) {
    const sorted = bookmarks;
    switch (field) {
      case 'created':
        sorted.sort((a, b) => a.created > b.created);
        break;
      case 'newest':
        sorted.sort((a, b) => a.object.date < b.object.date);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.object.date > b.object.date);
        break;
      case 'name-az':
        sorted.sort((a, b) => a.object.title > b.object.title);
        break;
      case 'name-za':
        sorted.sort((a, b) => a.object.title < b.object.title);
        break;
      case 'type':
        sorted.sort((a, b) => a.object.type > b.object.type);
        break;
      case 'dataset':
        sorted.sort((a, b) => a.object.dataset > b.object.dataset);
        break;
      case 'manual':
        sorted.sort((a, b) => a.sort > b.sort);
        break;
      default:
        // no sorting,just return
        return sorted;
    }

    return sorted;
  }

  getAnnotationTargets(bookmark) {
    const targets = this.state.bookmarks.filter(
      b => b.annotationId == bookmark.annotationId
    );
    return targets
  }

  /**
   * Delete bookmark
   *
   * @param {Object} bookmark Bookmark to be removed
   */
  deleteBookmark(bookmark) {
    // always ask before deleting
    if (!confirm('Are you sure you want to remove this bookmark?')) {
      return;
    }

    const targets = this.getAnnotationTargets(bookmark);

    //if there is only one target it means the selected bookmark was the last target of the parent annotation
    if(targets.length == 1) {
      //set the id to the annotationId so the API knows which actual annotation needs to be deleted
      bookmark.id = bookmark.annotationId;

      //delete the bookmark
      AnnotationAPI.deleteAnnotation(bookmark, data => {
        if (data && data.status) {
          if (data.status == 'success') {
            this.loadBookmarks();
          } else {
            alert(
              data.message
                ? data.message
                : 'An unknown error has occured while deleting the bookmark'
            );
          }
        } else {
          alert('An error has occured while deleting the bookmark.');
        }
      });
    } else {
      const annotation = this.state.annotations.filter(a => a.id == bookmark.annotationId)[0];
      annotation.target = annotation.target.filter(t => t.source != bookmark.targetId);
      AnnotationAPI.saveAnnotation(annotation, data => {
        if (data && data.status) {
          if (data.status == 'success') {
            this.loadBookmarks();
          } else {
            alert(
              data.message
                ? data.message
                : 'An unknown error has occured while deleting the bookmark'
            );
          }
        } else {
          alert('An error has occured while deleting the bookmark.');
        }
      });
    }
  }

  /**
   * Delete multiple bookmarks
   *
   * @param {array} selection List of bookmark ids to be deleted
   */
  deleteBookmarks(selection) {
    // always ask before deleting
    if (!confirm('Are you sure you want to remove the selected bookmarks?')) {
      return;
    }

    const data = this.state.bookmarks.filter(item =>
      selection.includes(item.id)
    );

    // counts number of hits
    let hits = data.length;

    // delete the bookmark
    data.forEach(item => {
      AnnotationAPI.deleteAnnotation(item, data => {
        hits--;

        // only on last callback, check the status and reload the data
        if (hits == 0) {
          if (data && data.status) {
            if (data.status == 'success') {
              this.loadBookmarks();
            } else {
              alert(
                data.message
                  ? data.message
                  : 'An unknown error has occured while deleting the bookmark'
              );
            }
          } else {
            alert('An error has occured while deleting the bookmark.');
          }
        }
      });
    });
  }

  /**
   * Export bookmarks
   *
   * @param {Object} annotations Annotations to be exported
   */
  exportBookmarks(selection) {
    const data = this.state.bookmarks.filter(item =>
      selection.includes(item.id)
    );
    exportDataAsJSON(data);
  }

  /**
   * Make current project active
   */
  makeActiveProject() {
    ComponentUtil.storeJSONInLocalStorage('activeProject', this.props.project);
  }

  /**
   * View bookmark
   *
   * @param {Object} bookmark Bookmark to be viewed
   */
  viewBookmark(bookmark) {
    // make current project active
    if (bookmark) {
      this.makeActiveProject();
    }
    this.setState({
      detailBookmark: bookmark
    });
  }

  /**
   * Sort change
   *
   * @param {string} sort Sort name
   */
  sortChange(e) {
    this.setSort(e.target.value);
  }

  /**
   * Select all items
   */
  selectAllChange(items, e) {
    if (e.target.checked) {
      const newSelection = this.state.selection.slice();
      items.forEach(item => {
        if (!newSelection.includes(item.id)) {
          newSelection.push(item.id);
        }
      });
      // set
      this.setState({
        selection: newSelection
      });
    } else {
      items = items.map(item => item.id);
      // unset
      this.setState({
        selection: this.state.selection.filter(item => !items.includes(item))
      });
    }
  }

  /**
   * Select bookmark item
   *
   * @param {object} item Bookmark item to handle
   * @param {boolean} select Indicate if the items should be selected
   */

  selectItem(item, select) {
    if (select) {
      if (!this.state.selection.includes(item.id)) {
        // add to selection
        this.setState({
          selection: [...this.state.selection, item.id]
        });
      }
      return;
    }

    // remove from selection
    if (!select) {
      this.setState({
        selection: this.state.selection.filter(selected => selected !== item.id)
      });
    }
  }

  /**
   * Close itemDetails view, and refresh the data (assuming changes have been made)
   */
  closeItemDetails() {
    // set viewbookmark to null
    this.viewBookmark(null);

    // refresh data
    this.loadBookmarks();
  }

  /**
   * Renders the results in the BookmarkTable component
   *
   * @param {object} renderState State of the render component
   * @return {Element} View results
   */
  renderResults(renderState) {
    return (
      <div>
        <h2>
          <input
            type="checkbox"
            checked={
              renderState.visibleItems.length > 0 &&
              renderState.visibleItems.every(item =>
                this.state.selection.includes(item.id)
              )
            }
            onChange={this.selectAllChange.bind(this, renderState.visibleItems)}
          />
          Bookmarks:{' '}
          <span className="count">{renderState.visibleItems.length || 0}</span>
        </h2>
        <div className="bookmark-table">
          {renderState.visibleItems.map((bookmark, index) => (
            <BookmarkRow
              key={index}
              bookmark={bookmark}
              onDelete={this.deleteBookmark}
              onView={this.viewBookmark}
              selected={this.state.selection.includes(bookmark.id)}
              onSelect={this.selectItem}
            />
          ))}
        </div>
      </div>
    );
  }

  /**
   * React render function
   *
   * @return {Element}
   */

  render() {
    return (
      <div className={IDUtil.cssClassName('bookmark-view')}>
        <BookmarkTable
          items={this.state.bookmarks}
          selection={this.state.selection}
          sortItems={this.sortBookmarks}
          orders={this.orders}
          filterItems={this.filterBookmarks}
          filters={this.state.filters}
          renderResults={this.renderResults}
          onExport={exportDataAsJSON}
        />

        <BulkActions
          bulkActions={this.bulkActions}
          selection={this.state.selection}
        />

        {this.state.detailBookmark ? (
          <ItemDetailsModal
            bookmark={this.state.detailBookmark}
            onClose={this.closeItemDetails}
          />
        ) : null}
      </div>
    );
  }
}

BookmarkView.propTypes = {
  user: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired
};

export default BookmarkView;
