import classNames from 'classnames';
import IDUtil from '../../util/IDUtil';
import ProjectAPI from '../../api/ProjectAPI';
import ProjectWrapper from './ProjectWrapper';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Modal (popup) that shows the details of an object. Currently in an iframe.
 */
class ItemDetailsModal extends React.PureComponent {
  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    return (
      <div className={IDUtil.cssClassName('item-details-modal')}>
        <div className="modal">
          <div className="container">
            <div className="close" onClick={this.props.onClose}>
              Close
            </div>

            <iframe
              src={
                '/tool/default-item-details?id=' +
                encodeURIComponent(this.props.bookmark.resourceId) +
                '&cid=' +
                encodeURIComponent(this.props.bookmark.collectionId) +
                '&bodyClass=noHeader'
              }
            />
            {/* Note: displaying the ItemDetailsRecipe in an overlay doesn't work smooth (css, dependencies, js errors)
              so, just show the page in an iframe for now.
              Todo: The creator/manager of ItemDetailsRecipe should be able to fix this. */}

            {/* <ItemDetailsRecipe recipe={yourItemDetailsRecipeData?}
                                 user={this.props.user}
                                 params={{id: this.state.viewObject.object.id, cid: this.state.viewObject.object.dataset}} /> */}
          </div>
        </div>
      </div>
    );
  }
}

ItemDetailsModal.propTypes = {
  bookmark: PropTypes.shape({
    resourceId: PropTypes.string.isRequired,
    collectionId: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default ItemDetailsModal;
