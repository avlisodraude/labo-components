import AnnotationStore from '../../flux/AnnotationStore';
import IDUtil from '../../util/IDUtil';
import ProjectAPI from '../../api/ProjectAPI';
import ProjectWrapper from './ProjectWrapper';
import PropTypes from 'prop-types';

class BookmarkRow extends React.PureComponent {

  render(){
    let bookmark = this.props.bookmark;
   return (
      <div className={IDUtil.cssClassName('bookmark-row')}>

        <div className="bookmark">
          <div className="selector">
            <input type="checkbox"/>
          </div>

          <div className="image" style={{backgroundImage: 'url('+bookmark.object.placeholderImage+')'}}/>

          <div className="info">
            <table>
              <tbody>
              <tr>
                <td>
                  <h4 className="label">Title</h4>
                  <p>{this.props.bookmark.object.title}</p>
                </td><td>
                  <h4 className="label">Date</h4>
                  <p>{this.props.bookmark.object.date.substring(0,10)}</p>
                </td>
              </tr>
              <tr>
                <td>         
                  <h4 className="label">Type</h4>
                  <p>{this.props.bookmark.object.type}</p>
                </td><td>
                  <h4 className="label">Dataset</h4>
                  <p>{this.props.bookmark.object.dataset}</p>
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <div className="actions">
            <div className="btn blank warning">Delete</div>
            <div className="btn">View</div>
          </div>

        </div>
      </div>
    )
  }
}

BookmarkRow.propTypes = {
  bookmark: PropTypes.object
}

export default BookmarkRow;