import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';

class ProjectSessions extends React.Component {

  render(){
    return (
      <div className={IDUtil.cssClassName('project-sessions')}>
        <p>Todo: Tool Sessions</p>
      </div>
    )
  }
}


class WrappedProjectSessions extends React.Component{
  render(){
    return(
      <ProjectWrapper {...this.props} renderComponent={ProjectSessions} />
    )
  }
}

export default WrappedProjectSessions;