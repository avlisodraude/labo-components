import PersonalCollectionAPI from '../../../api/PersonalCollectionAPI';

import IDUtil from '../../../util/IDUtil';

import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

import CollectionForm from './CollectionForm';

import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';


/**
 * Wrapper for pages within a single collection.
 * It also provides the collection data to the subviews.
 */
class CollectionWrapper extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      collection: null,
      bookmarkCount: 0
    };
  }

  /**
   * React lifecycle event
   */
  componentDidMount() {
    this.loadCollection();
  }

  /**
   * Load collection from url id and load it to the state
   */
  loadCollection() {
    const collectionId = this.props.match.params.id;

    // load project data, and set state
    PersonalCollectionAPI.get(this.props.user.id, collectionId, collection => {
      // inject project name to breadcrumbs
      const titles = {};
      titles[collection.id] = collection.name;
      // update breadcrumbs
      setBreadCrumbsFromMatch(this.props.match, titles);

      // set to state
      this.setState({
        loading: false,
        collection
      });

    });
  }

  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    const RenderComponent = this.props.renderComponent;
    const collection = this.state.collection;
    return (
      <div className={IDUtil.cssClassName('collection-wrapper')}>
        {this.state.loading ? (
          <h3 className="loading">Loading...</h3>
        ) : project ? (
          <div>
            <div className="collection-header">
              <div className="info-bar">
                <h2>{collection.name || 'Unnamed collection'}</h2>
                <p>{collection.description}</p>
              </div>

              <div className="submenu">
                <NavLink
                  activeClassName="active"
                  to={
                    '/workspace/collections/' +
                    encodeURIComponent(collection.id) +
                    '/details'
                  }
                >
                  Details
                </NavLink>
              </div>
            </div>

            <div class="component">
              <RenderComponent {...this.props} collection={this.state.collection} />
            </div>
          </div>
        ) : (
          <h3 className="error">Collection could not be found</h3>
        )}
      </div>
    );
  }
}

export default CollectionWrapper;
