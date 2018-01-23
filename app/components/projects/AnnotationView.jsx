import AnnotationAPI from '../../api/AnnotationAPI';
import AnnotationRow from './AnnotationRow';
import AnnotationStore from '../../flux/AnnotationStore';
import AnnotationUtil from '../../util/AnnotationUtil';
import BookmarkUtil from '../../util/BookmarkUtil';
import BookmarkTable from './BookmarkTable';
import BulkActions from '../helpers/BulkActions';
import ComponentUtil from '../../util/ComponentUtil';
import IDUtil from '../../util/IDUtil';
import ItemDetailsModal from './ItemDetailsModal';
import ProjectAPI from '../../api/ProjectAPI';
import ProjectWrapper from './ProjectWrapper';
import PropTypes from 'prop-types';
import { exportDataAsJSON } from '../helpers/Export';

/**
 * This view handles the loading, filtering and selection of data of
 * the Annotations list of a project. It is displayed using the BookmarkTable component.
 */
class AnnotationView extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);

    this.annotationTypes = [
      { value: 'classification', name: 'Classification' },
      { value: 'comment', name: 'Comment' },
      { value: 'link', name: 'Link' },
      { value: 'metadata', name: 'Metadata' }
    ];

    this.orders = [{ value: 'created', name: 'Annotation created' }];

    this.bulkActions = [
      { title: 'Delete', onApply: this.deleteAnnotations.bind(this) },
      { title: 'Export', onApply: this.exportAnnotationsByIds.bind(this) }
    ];

    this.state = {
      parentAnnotations : null,
      annotations: [],
      selection: [],
      loading: true,
      detailBookmark: null,
      filters: []
    };

    // bind functions
    this.closeItemDetails = this.closeItemDetails.bind(this);
    this.deleteAnnotations = this.deleteAnnotations.bind(this);
    this.exportAnnotations = this.exportAnnotations.bind(this);
    this.filterAnnotations = this.filterAnnotations.bind(this);
    this.renderResults = this.renderResults.bind(this);
    this.selectAllChange = this.selectAllChange.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.sortAnnotations = this.sortAnnotations.bind(this);
    this.viewBookmark = this.viewBookmark.bind(this);
  }

  /**
   * React lifecycle event
   */
  componentWillMount() {
    this.loadAnnotations();
  }

  /**
   * Load Annotation from Store
   */
  loadAnnotations() {
    AnnotationStore.getUserProjectAnnotations(
      this.props.user,
      this.props.project,
      this.onLoadAnnotations.bind(this)
    );
  }

  /**
   * Get filter list of existing annotation types
   *
   * @param  {array} items List of annotations
   * @return {array}       List of filters
   */
  getFilters(items) {
    const filters = [];
    // only add existing types to the filter
    this.annotationTypes.forEach(type => {
      if (items.some(annotation => annotation.annotationType == type.value)) {
        filters.push(type);
      }
    });
    return filters;
  }

  /**
   * Annotation load callback: set data to state
   *
   * @param  {Object} data Response object with annotation list
   */
  onLoadAnnotations(data) {
    const parentAnnotations = data.annotations || [];

    let annotations = AnnotationUtil.generateAnnotationCentricList(
      parentAnnotations
    );

    this.setState({
      parentAnnotations : data.annotations,
      annotations: annotations,
      loading: false,
      filters: this.getFilters(annotations)
    }, () => {
      this.updateSelection(annotations)
    });

  }

  /**
   * Update Selection list, based on available items
   *
   * @param  {array} items  Current data
   */
  updateSelection(items) {
    this.setState({
      selection: items
        .map(item => item.annotationId)
        .filter(itemId => this.state.selection.includes(itemId))
    });
  }

  /**
   * Filter annotation list by given filter
   *
   * @param  {array} annotations  Annotations array
   * @param  {object} filter    Filter object
   * @return {array}            Filtered annotations array
   */
  filterAnnotations(annotations, filter) {
    // filter on keywords in title, dataset or type
    if (filter.keywords) {
      const keywords = filter.keywords.split(' ');
      keywords.forEach(k => {
        k = k.toLowerCase();
        annotations = annotations.filter(
          annotation =>
            (annotation.text && annotation.text.toLowerCase().includes(k)) ||
            (annotation.vocabulary &&
              annotation.vocabulary.toLowerCase().includes(k)) ||
            (annotation.label && annotation.label.toLowerCase().includes(k)) ||
            (annotation.template &&
              annotation.template.toLowerCase().includes(k)) ||
            // search the properties of a metadata annotation; both key/value fields
            (annotation.properties &&
              annotation.properties.some(
                property =>
                  (property.key && property.key.toLowerCase().includes(k)) ||
                  (property.value && property.value.toLowerCase().includes(k))
              ))
        );
      });
    }

    // filter on type
    if (filter.type) {
      annotations = annotations.filter(annotation =>
        annotation.annotationType.toLowerCase().includes(filter.type)
      );
    }

    return annotations;
  }

  /**
   * Sort annotations
   *
   * @param {Array} annotations List of annotations to be sorted
   * @param {string} field Sort field
   * @return {Array} Sorted annotations
   */
  sortAnnotations(annotations, field) {
    const sorted = annotations;
    switch (field) {
      case 'created':
        sorted.sort((a, b) => a.created > b.created);
        break;
      default:
        // no sorting,just return
        return sorted;
    }

    return sorted;
  }

  deleteAnnotations(annotationIds) {
    if(annotationIds) {
      // always ask before deleting
      let msg = 'Are you sure you want to remove the selected annotation';
      msg += annotationIds.length == 1 ? '?' : 's?';
      if (!confirm(msg)) {
        return;
      }

      BookmarkUtil.deleteAnnotations(
        this.state.parentAnnotations,
        this.state.annotations,
        annotationIds,
        (success) => {
          console.debug('reloading annotation-list', this)
          this.loadAnnotations()
        }
      )
    }
  }

  /**
   * Export annotation by their ids
   *
   * @param {Object} annotationIds Ids of annotations to be exported
   */
  exportAnnotationsByIds(annotationIds) {
    const data = this.state.annotations.filter(item =>
      annotationIds.includes(item.annotationId)
    );
    this.exportAnnotations(data);
  }

  /**
   * Export annotations
   *
   * @param {Object} annotations Annotations to be exported
   */
  exportAnnotations(annotations) {
    let data = this.state.annotations.filter(item =>
      annotations.includes(item)
    );

    // remove cyclic structures
    data = data.map(d => {
      delete d.bookmarkAnnotation;
      delete d.bookmarks;
      return d;
    });

    exportDataAsJSON(data);
  }

  /**
   * View bookmark
   *
   * @param {Object} bookmark Bookmark (object) to be viewed
   */
  viewBookmark(bookmark) {
    this.setState({
      detailBookmark: bookmark
    });
  }

  /**
   * Close itemDetails view, and refresh the data (assuming changes have been made)
   */
  closeItemDetails() {
    // set viewbookmark to null
    this.viewBookmark(null);

    // refresh data
    this.loadAnnotations();
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
   *
   * @param {array} items Items to be selected
   * @param {SyntheticEvent} e Event
   */
  selectAllChange(items, e) {
    if (e.target.checked) {
      const newSelection = this.state.selection.slice();
      items.forEach(item => {
        if (!newSelection.includes(item.annotationId)) {
          newSelection.push(item.annotationId);
        }
      });
      // set
      this.setState({
        selection: newSelection
      });
    } else {
      items = items.map(item => item.annotationId);
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
      if (!this.state.selection.includes(item.annotationId)) {
        // add to selection
        this.setState({
          selection: [...this.state.selection, item.annotationId]
        });
      }
      return;
    }

    // remove from selection
    if (!select) {
      this.setState({
        selection: this.state.selection.filter(
          selected => selected !== item.annotationId
        )
      });
    }
  }

  /**
   * Renders the results in the AnnotationTable component
   *
   * @param {string} type Annotation type title
   * @param {array} items Annotations to render
   * @return {Element} Render result for AnnotationTable, or null
   *
   */
  renderResultType(type, items) {
    // don't render empty results
    if (items.length == 0) {
      return null;
    }

    return (
      <div className="type-list">
        <h3>
          <input
            type="checkbox"
            checked={
              items.length > 0 &&
              items.every(item =>
                this.state.selection.includes(item.annotationId)
              )
            }
            onChange={this.selectAllChange.bind(this, items)}
          />
          {type}: <span className="count">{items.length || 0}</span>
        </h3>
        <div className="bookmark-table">
          {items.map((annotation, index) => (
            <AnnotationRow
              key={index}
              annotation={annotation}
              onDelete={this.deleteAnnotations}
              onView={this.viewBookmark}
              selected={this.state.selection.includes(annotation.annotationId)}
              onSelect={this.selectItem}
            />
          ))}
        </div>
      </div>
    );
  }

  /**
   * Renders callback for the BookmarkTable component
   *
   * @param {object} renderState State of the component
   * @return {Element} Render result for BookmarkTable
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
                this.state.selection.includes(item.annotationId)
              )
            }
            onChange={this.selectAllChange.bind(this, renderState.visibleItems)}
          />
          Annotations:{' '}
          <span className="count">{renderState.visibleItems.length || 0}</span>
        </h2>
        <div className="table">
          {this.annotationTypes.map(type =>
            this.renderResultType(
              type.name,
              renderState.visibleItems.filter(
                item => item.annotationType == type.value
              )
            )
          )}
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
      <div className={IDUtil.cssClassName('annotation-view')}>
        <BookmarkTable
          items={this.state.annotations}
          selection={this.state.selection}
          sortItems={this.sortAnnotations}
          orders={this.orders}
          filterItems={this.filterAnnotations}
          filters={this.state.filters}
          renderResults={this.renderResults}
          onExport={this.exportAnnotations}
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

AnnotationView.propTypes = {
  api: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired
};

export default AnnotationView;
