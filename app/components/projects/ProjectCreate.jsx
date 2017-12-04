import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectForm from './ProjectForm';

class ProjectCreate extends React.Component {

  save(project, callback){
    // todo:save project to api
    // get id 
    console.log(project);
    ProjectAPI.save(this.props.user.id, project, (project) => {
      if (project){
        // navigate to new project page
        this.props.history.push('/workspace/projects/' + project.id)
      } else{
        alert('An error occured while saving this project');
      }
      
    });
    
  }

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
          project={{name:'', description:'', isPrivate:false}}
          onSave={this.save.bind(this)}
         />
      </div>
    )
  }

}

export default ProjectCreate;