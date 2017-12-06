import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';


class ProjectBookmarks extends React.PureComponent {

  render(){
    return (
       <div className={IDUtil.cssClassName('project-annotations')}>
        <p>Todo: Bookmarks & Annotations</p>
      </div>
    )
  }
}

class WrappedProjectBookmarks extends React.PureComponent{
  render(){
    return(
      <ProjectWrapper {...this.props} renderComponent={ProjectBookmarks} />
    )
  }
}

export default WrappedProjectBookmarks;