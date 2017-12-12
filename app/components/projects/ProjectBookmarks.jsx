import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';
import BookmarkView from './BookmarkView';
import AnnotationView from './AnnotationView';


class ProjectBookmarks extends React.PureComponent {

  constructor(props) {
    super(props);

    // unique keys used for storage
    this.keys={
      view: "bg__project-bookmarks-view"
    }

    // get view from session storage
    let view = window.sessionStorage.getItem(this.keys.view) || 'bookmark-centric'; // bookmark-centric, annotation-centric
    this.state = {
      annotations : [],
      loading : true,
      view: view
    }

    this.viewChange = this.viewChange.bind(this);
  }

   /**
   * View changes
   * @param {SyntheticEvent} e Event
   */
  viewChange(e){
    let view = e.target.value;

    // store view to session storage
    window.sessionStorage.setItem(this.keys.view,view);

    this.setState({
        view
    });
  }




  render(){

    let viewComponent = null;

    switch(this.state.view){
      case 'bookmark-centric':
        viewComponent = <BookmarkView user={this.props.user} project={this.props.project} />;
      break;
      case 'annotation-centric':
        viewComponent = <AnnotationView user={this.props.user} project={this.props.project} />;
      break;
    }

    return (
      <div className={IDUtil.cssClassName('project-bookmarks')}>
        <div className="tools">

          <div className="view">
            <h3>View</h3>
            <div className="radiogroup">

              <input type="radio"
                     name="view"
                     value="bookmark-centric"
                     id="view-bookmark"
                     checked={this.state.view==='bookmark-centric'}
                     onChange={this.viewChange}
                     />
              <label htmlFor="view-bookmark">Bookmark-centric</label>

              <input type="radio"
                     name="view"
                     value="annotation-centric"
                     id="view-annotation"
                     checked={this.state.view==='annotation-centric'}
                     onChange={this.viewChange}
                     />
              <label htmlFor="view-annotation">Annotation-centric</label>

            </div>
          </div>

        </div>
        { viewComponent }
</div>
  )
  }
}

class WrappedProjectBookmarks extends React.PureComponent{
  render(){
    return(
      <ProjectWrapper renderComponent={ProjectBookmarks} {...this.props}  />
    )
  }
}

export default WrappedProjectBookmarks;