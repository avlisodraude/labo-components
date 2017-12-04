import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectForm from './ProjectForm';
import PropTypes from 'prop-types';

class ProjectCreate extends React.Component {

  render(){
    return (
      <div className={IDUtil.cssClassName('project-create')}>
        <div className="info-bar">
          <h2>Create User Project</h2>
          <p>A user project contains Bookmarks & Annotations and Tool Sessions</p>
        </div>

        <ProjectForm
          submitButton="create"
          cancelLink="/workspace/projects"          
          project={{name:'', description:'', isPrivate: false}}
          projectDidSave={(project) => {
            // navigate to new project page
            this.props.history.push('/workspace/projects/' + project.id)
          }}
          user={this.props.user}
         />
      </div>
    )
  }
}

export default ProjectCreate;