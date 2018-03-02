import classNames from 'classnames';
import ComponentUtil from '../../util/ComponentUtil';
import IDUtil from '../../util/IDUtil';
import PropTypes from 'prop-types';
import SortTable from '../projects/SortTable';
import { exportDataAsJSON } from '../helpers/Export';
import { Link } from 'react-router-dom';

/**
 * Table that shows all the collections. It handles the loading and filtering of the collection data.
 */
class CollectionTable extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);

    this.head = [
      { field: 'name', content: 'Name', sortable: true },
      { field: 'owner', content: 'Owner', sortable: true },
      { field: 'access', content: 'Access', sortable: true },
      { field: 'created', content: 'Created', sortable: true },
      { field: '', content: '', sortable: false },
      { field: '', content: '', sortable: false },
      { field: '', content: '', sortable: false }
    ];

    this.bulkActions = [
      { title: 'Delete', onApply: this.deleteCollections.bind(this) }
      /*{ title: 'Export', onApply: exportDataAsJSON.bind(this) }*/
    ];

    this.defaultSort = {
      field: 'name',
      order: 'asc'
    }

    this.state = {
      collections: [],
      loading: true,
      filter: {
        keywords: '',
        currentUser: false
      },
      bookmarkCount: 0
    };

    this.requestedBookmark = {};

    this.requestDataTimeout = -1;

    this.sortCollections = this.sortCollections.bind(this);
    this.getCollectionRow = this.getCollectionRow.bind(this);
  }

  /**
   * Call filter callback
   */
  loadData() {
    this.setState({
      loading: true
    });

    this.props.api.list(
      this.props.user.id,
      this.state.filter,
      this.setCollections.bind(this)
    );
  }

  /**
   * Set new list of collections to state
   *
   * @param {array} collections List of collections
   */
  setCollections(collections) {
    // decorate the collections
    this.toDummyData(collections || []);

    // we filter the results now on client side
    collections = this.filterCollections(collections || []);

    //TODO this is for now the only place where this is set. Probably not good enough
    ComponentUtil.storeJSONInLocalStorage('myCollections', collections);

    this.setState({
      collections: collections,
      loading: false
    });
  }

  /**
   * Filter collections client side
   * This can later be performed on the server/api side
   *
   * @param {array} collections Collections to be filtered
   */
  filterCollections(collections) {
    const userId = this.props.user.id;
    let result = collections.filter(collection => collection.getAccess(userId));
    const filter = this.state.filter;

    // filter on keywords
    if (filter.keywords) {
      const keywords = filter.keywords.split(' ');
      keywords.forEach(k => {
        k = k.toLowerCase();
        result = result.filter(
          collection =>
            collection.name.toLowerCase().includes(k) ||
            collection.description.toLowerCase().includes(k)
        );
      });
    }

    // filter on current user
    if (filter.currentUser) {
      result = result.filter(collection => collection.owner.id === userId);
    }

    return result;
  }

  /**
   * Decorate collection data with helper functions
   * (currently placeholders) - See ProjectTable.jsx as well.
   *
   * @param {array} collections Collections to decorated
   */
  toDummyData(collections) {
    return collections.map(c => {
      c.getAccess = function() {
        return 'Admin';
      };
      //p.getCollaboratorCount = function() {
      //  return this.collaborators.length;
      //};
      c.canDelete = function() {
        return true;
      };
      c.canExport = function() {
        return true;
      };
      c.canOpen = function() {
        return true;
      };
      //c.collaborators = [];
      c.owner = {
        id: this.props.user.id,
        name: this.props.user.name
      };
      return c;
    });
  }

  /**
   * Keywords filter changes
   *
   * @param {SyntheticEvent} e Event
   */
  keywordsChange(e) {
    this.setState({
      filter: Object.assign({}, this.state.filter, {
        keywords: e.target.value
      })
    });
  }

  /**
   * Keywords filter changes
   *
   * @param {SyntheticEvent} e Event
   */
  currentUserChange(e) {
    this.setState({
      filter: Object.assign({}, this.state.filter, {
        currentUser: e.target.checked
      })
    });
  }

  /**
   * After mounting, retrieve project data
   */
  componentDidMount() {
    this.loadData();
  }

  /**
   * Listen for update, request new data if filter has been changed
   */
  componentDidUpdate() {
    if (this.lastFilter !== this.state.filter) {
      this.lastFilter = this.state.filter;

      // throttle data requests
      clearTimeout(this.requestDataTimeout);
      this.requestDataTimeout = setTimeout(this.loadData.bind(this), 500);
    }
  }

  /**
   * Delete project if confirmed
   *
   * @param {object} project Project to delete
   */
  deleteCollection(collection) {
    if (
      window.confirm('Are you sure you want to delete collection ' + collection.name)
    ) {
      this.props.api.delete(this.props.user.id, collection.id, status => {
        if (status && status.success) {
          // just retrieve the latest data
          this.loadData();
        }
      });
    }
  }
  
  /**
   * Enrich collection with selected enrichment service
   *
   * @param {object} collection Collection to delete
   */
  enrichCollection(collection, event) { 
      var enrichmentservice = event.target.value;      
      if (enrichmentservice == "ASR"){
          //Do something with collection
      }
          
  }

  /**
   * Delete *multiple* collections if confirmed
   *
   * @param {array} collections Collections to delete
   */
  deleteCollections(collections) {
    if (
      window.confirm(
        'Are you sure you want to delete ' + collections.length + ' collections?'
      )
    ) {
      let calls = collections.length;

      // after each return calls is decreased
      // when calls is 0, data is reloaded
      // this is async safe
      collections.forEach((collection, index) => {
        this.props.api.delete(this.props.user.id, collection.id, status => {
          calls--;
          if (calls == 0) {
            // after the last delete just retrieve the latest data
            this.loadData();
          }
        });
      });
    }
  }

  /**
   * Sort collections based on sort
   *
   * @param {array} collections List of bookmarks to be sorted
   * @param {object} sort Sort field and order
   */
  sortCollections(collections, sort) {
    const sorted = collections;
    switch (sort.field) {
      case 'name':
        sorted.sort((a, b) => a.name > b.name);
        break;
      case 'owner':
        sorted.sort((a, b) => a.owner.name > b.owner.name);
        break;
      case 'access':
        sorted.sort(
          (a, b) =>
            a.getAccess(this.props.user.id) > b.getAccess(this.props.user.id)
        );
        break;
      case 'created':
        sorted.sort((a, b) => a.created > b.created);
        break;
      default:
        // no sorting,just return
        return sorted;
    }

    return sort.order === 'desc' ? sorted.reverse() : sorted;
  }

  /**
   * Get collection row for given collection
   *
   * @param {object} collection Collection data to render
   */
  getCollectionRow(collection) {
    const currentUserId = this.props.user.id;
    
    return [
      {
        props: { className: 'primary' },
        content: (
          <Link to={'/workspace/collections/' + collection.id + '/edit'}>{collection.name}</Link>
        )
      },
      {
        content: (
          <span>
            {collection.owner.name}{' '}
            
          </span>
        )
      },
      {
        props: { className: 'access' },
        content: collection.getAccess(currentUserId)
      },
      {
        props: { className: 'smaller' },
        content: collection.created.substring(0, 10)
      },
      {
        content: collection.canDelete(currentUserId) ? (
          <a
            className="btn blank warning"
            onClick={this.deleteCollection.bind(this, collection)}
          >
            Delete
          </a>
        ) : (
          ''
        )
      },
      {
          content: (
          <select onChange={this.enrichCollection.bind(this, collection)}>
            <option value="None">Select Enrichment</option>
            <option value="ASR">ASR</option>
          </select>
          )
      },     
      {
        content: collection.canOpen(currentUserId) ? (
          <Link to={'/workspace/collections/' + collection.id + '/edit'} className="btn">
            Open
          </Link>
        ) : (
          ''
        )
      }
    ];
  }

  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    return (
      <div className={IDUtil.cssClassName('collection-table')}>
        <div className="tools">
          <div className="left">
            <h3>Filters</h3>
            <input
              className="search"
              type="text"
              placeholder="Search"
              value={this.state.filter.keywords}
              onChange={this.keywordsChange.bind(this)}
            />
            <input
              type="checkbox"
              id="current-user"
              checked={this.state.filter.currentUser}
              onChange={this.currentUserChange.bind(this)}
            />
            <label htmlFor="current-user">Show only my collections</label>
          </div>
        </div>

        <SortTable
          items={this.state.collections}
          head={this.head}
          row={this.getCollectionRow}
          onSort={this.sortCollections}
          loading={this.state.loading}
          bulkActions={this.bulkActions}
          defaultSort={this.defaultSort}
        />
      </div>
    );
  }
}

CollectionTable.propTypes = {
  // personalcollection api
  api: PropTypes.shape({
    list: PropTypes.func.isRequired
  }),

  // current user object used for defining access roles per collection
  user: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired
};

export default CollectionTable;
