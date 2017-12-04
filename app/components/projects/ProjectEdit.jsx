import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectForm from './ProjectForm';
import PropTypes from 'prop-types';

class ProjectEdit extends React.Component {


  constructor(props){
    super(props);

    this.state={
      loading: true,
      project: null
    }
  }

  componentDidMount(){
    // get project id from url
    let projectId = this.props.match.params.id; 

    // request current project data
    // This function is missing from the API
    if (!ProjectAPI.get){
      console.error('This page requires the projectAPI.get function to be implemented');
      return;
    }

    // load project data, and set state
    ProjectAPI.get(projectId, (project) => {
      this.setState({
        loading: false,
        project
      })
    })
  }

  render(){
    return (
      <div className={IDUtil.cssClassName('project-edit')}>
        <div className="info-bar">
          <h2>Edit User Project</h2>
          <p>A user project contains Bookmarks & Annotations and Tool Sessions</p>
        </div>

        {this.state.loading ? 
          <h3 className="loading">Loading...</h3>
          : 
          this.state.project ? 
            <ProjectForm
              submitButton="save"
              cancelLink={"/workspace/projects"+this.state.project.id}
              project={this.state.props.project}
              projectDidSave={(project) => {
                // navigate to new project page
                this.props.history.push('/workspace/projects/' + project.id)
              }}
              user={this.props.user}
            />
          :
          <h3 className="error">Project could not be found</h3>
         }
      </div>
    )
  }

}

export default ProjectEdit;