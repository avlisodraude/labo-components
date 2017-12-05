import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectForm from './ProjectForm';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

class ProjectWrapper extends React.Component {

  constructor(props){
    super(props);

    this.state={
      loading: true,
      project: null
    }
  }

  componentDidMount(){
    this.loadProject();
  }

  /**
   * Load project from url id and load it to the state
   */
  loadProject(){
    // get project id from url
    let projectId = this.props.match.params.id; 

    // load project data, and set state
    ProjectAPI.get(this.props.user.id, projectId, (project) => {
      this.setState({
        loading: false,
        project
      })
    })
  }


  render(){
    let RenderComponent = this.props.renderComponent;
    let project = this.state.project;
    return (
      <div className={IDUtil.cssClassName('project-wrapper')}>
        {this.state.loading ? 
          <h3 className="loading">Loading...</h3>
          : 
          project ? 
            <div>
              <div className="project-header">

                <div className="info-bar">
                  <h2>{project.name || 'Unnamed project'}</h2>
                  <p>{project.description}</p>
                </div>

                <div className="submenu">
                  <NavLink activeClassName="active" to={"/workspace/projects/"+encodeURIComponent(project.id)+"/bookmarks"}>Bookmarks & Annotations<span className="count">{project.bookmarks ? project.bookmarks.count : 0}</span></NavLink>
                  <NavLink activeClassName="active" to={"/workspace/projects/"+encodeURIComponent(project.id)+"/sessions"}>Tool Sessions<span className="count">{project.sessions ? project.sessions.count : 0}</span></NavLink>
                  <NavLink activeClassName="active" to={"/workspace/projects/"+encodeURIComponent(project.id)+"/details"}>Details</NavLink>
                </div>
              </div>

              <div class="component">
                <RenderComponent {...this.props} project={this.state.project} />
              </div>

            </div>
          :
          <h3 className="error">Project could not be found</h3>
         }
      </div>
    )
  }

}

export default ProjectWrapper;