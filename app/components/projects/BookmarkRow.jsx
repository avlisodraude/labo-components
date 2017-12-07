import AnnotationStore from '../../flux/AnnotationStore';
import IDUtil from '../../util/IDUtil';
import ProjectAPI from '../../api/ProjectAPI';
import ProjectWrapper from './ProjectWrapper';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class BookmarkRow extends React.PureComponent {

  constructor(props){
    super(props);

    this.state={
      showAnnotations: this.props.bookmark.annotations && this.props.bookmark.annotations.length > 0,
    }

    // bind functions
    this.onDelete = this.onDelete.bind(this);
    this.onView = this.onView.bind(this);
  }

  /**
   * Delete bookmark action
   */
  onDelete(){
    this.props.onDelete(this.props.bookmark);
  }

  /**
   * View bookmark action
   */
  onView(){
    this.props.onView(this.props.bookmark);
  }

  /**
   * Toggle Annotations
   */
  toggleAnnotations(){
    this.setState({
      showAnnotations: !this.state.showAnnotations
    })    
  }

  render(){
    let bookmark = this.props.bookmark;
    let annotations = bookmark.annotations || [];
    let hasAnnotations = annotations.length > 0;

    console.log(bookmark);

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
            <div className="btn blank warning" 
                 onClick={this.onDelete}>Delete</div>
            <div className="btn"
                 onClick={this.onView}>View</div>
          </div>

          <div className={classNames('annotation-button',{'active':this.state.showAnnotations, 'zero': !hasAnnotations})} 
               onClick={this.toggleAnnotations.bind(this)}
               >
            Annotations <span className="count">{annotations.length}</span>
          </div>

        </div>


        { this.state.showAnnotations ?
          <div className="annotations">
            {!hasAnnotations ?
              <p>This {bookmark.object.type.toLowerCase() || 'object'} has no annotations yet</p>
              :
           
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
              {annotations.map((annotation)=>(
                <tr>
                  <td>{annotation.annotationType}</td>
                  <td>
                    {annotation.vocabulary ? annotation.vocabulary : ''}
                    {annotation.annotationType === 'comment' ? annotation.created : ''}
                  </td>
                  <td>
                    {annotation.text ? annotation.text.substring(0,200) : ''}                    
                    {annotation.label ? annotation.label : ''}
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          }
          </div>
          :
          null
        }          

      </div>
    )
  }
}

BookmarkRow.propTypes = {
  bookmark: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
}

export default BookmarkRow;