import IDUtil from '../../util/IDUtil';
import CollectionTable from './CollectionTable';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

/**
 * Top level component/page for the collections overview.
 * The data handling is done in the CollectionTable component.
 */
class CollectionsOverview extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);
  }

  /**
   * React lifecycle event
   */
  componentDidMount() {
    setBreadCrumbsFromMatch(this.props.match);
  }

  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    return (
      <div className={IDUtil.cssClassName('projects-overview')}>
        <div className="info-bar">
          <Link to="/workspace/collections/create" className="btn primary add">
            Add User Collection
          </Link>
          <h2>User Collections</h2>
          <p>Add private collections to use them in the Media Suite</p>
        </div>

        <CollectionTable api={this.props.api} user={this.props.user} />
      </div>
    );
  }
}

CollectionsOverview.propTypes = {
  // collection api
  api: PropTypes.shape({
    list: PropTypes.func.isRequired
  }),

  // current user object used for defining access roles per collection
  user: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired
};

export default CollectionsOverview;
