import PersonalCollectionAPI from '../../../api/PersonalCollectionAPI';

import IDUtil from '../../../util/IDUtil';

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Show the details of the given collection.
 */
class CollectionDetails extends React.PureComponent {
  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    const collection = this.props.collection;
    return (
      <div className={IDUtil.cssClassName('project-details')}>
        <h2>Collection Details</h2>
        <Link
          to={'/workspace/collections/' + encodeURIComponent(collection.id) + '/edit'}
          className="btn"
        >
          Edit details
        </Link>
        <ul className="details">
          <li>
            <h5 className="label">Collection title</h5>
            <p>{collection.name}</p>
          </li>
          <li>
            <h5 className="label">Description</h5>
            <p>{collection.description}</p>
          </li>
          <li>
            <h5 className="label">Visibility</h5>
            <p>{collection.isPrivate ? 'Private' : 'Public'}</p>
          </li>
          <li>
            <h5 className="label">Created</h5>
            <p>{collection.created.substring(0, 10)}</p>
          </li>
        </ul>
      </div>
    );
  }
}

CollectionDetails.propTypes = {

  collection: PropTypes.object.isRequired
};


class WrappedCollectionDetails extends React.PureComponent {
  render() {
    return <CollectionWrapper {...this.props} renderComponent={CollectionDetails} />;
  }
}

WrappedCollectionDetails.propTypes = CollectionDetails.propTypes;

export default WrappedCollectionDetails;
