import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
//import ItemDetailsRecipe from '../../ItemDetailsRecipe';

class ItemDetailsModal extends React.PureComponent {

  render(){
    var object = this.props.object;
    return(
    <div className={IDUtil.cssClassName('item-details-modal')}>
      <div className="modal">
        <div className="container">
         <div className="close" onClick={this.props.onClose}>Close</div>

          <iframe src={"/tool/default-item-details?id="+encodeURIComponent(object.id)+"&cid="+encodeURIComponent(object.dataset)+"&bodyClass=noHeader"} />
          {/* Note: displaying the ItemDetailsRecipe in an overlay doesn't work smooth (css, dependencies, js errors)
              so, just show the page in an iframe for now. 
              Todo: The creator/manager of ItemDetailsRecipe should be able to fix this. */}

          {/* <ItemDetailsRecipe recipe={yourItemDetailsRecipeData?} 
                                 user={this.props.user} 
                                 params={{id: this.state.viewObject.object.id, cid: this.state.viewObject.object.dataset}} /> */}
        </div>
      </div>
    </div>
    )
  }
}

ItemDetailsModal.propTypes = {
  object: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default ItemDetailsModal;