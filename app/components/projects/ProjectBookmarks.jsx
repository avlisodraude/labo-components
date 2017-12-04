import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';


class ProjectBookmarks extends React.Component {

  render(){
    return (
       <div className={IDUtil.cssClassName('project-annotations')}>
        <p>Todo: Bookmarks & Annotations</p>
      </div>
    )
  }
}

class WrappedProjectBookmarks extends React.Component{
  render(){
    return(
      <ProjectWrapper {...this.props} renderComponent={ProjectBookmarks} />
    )
  }
}

export default WrappedProjectBookmarks;