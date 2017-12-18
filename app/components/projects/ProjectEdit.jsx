import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectForm from './ProjectForm';
import PropTypes from 'prop-types';
import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

class ProjectEdit extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      project: null
    };
  }

  componentDidMount() {
    // get project id from url
    const projectId = this.props.match.params.id;

    // load project data, and set state
    ProjectAPI.get(this.props.user.id, projectId, project => {
      // inject project name to breadcrumbs
      const titles = {};
      titles[project.id] = project.name;
      // update breadcrumbs
      setBreadCrumbsFromMatch(this.props.match, titles);

      this.setState({
        loading: false,
        project
      });
    });
  }

  render() {
    return (
      <div className={IDUtil.cssClassName('project-edit')}>
        <div className="info-bar">
          <h2>Edit User Project</h2>
          <p>
            A user project contains Bookmarks & Annotations and Tool Sessions
          </p>
        </div>

        {this.state.loading ? (
          <h3 className="loading">Loading...</h3>
        ) : this.state.project ? (
          <ProjectForm
            submitButton="save"
            cancelLink={
              '/workspace/projects/' +
              encodeURIComponent(this.state.project.id) +
              '/details'
            }
            project={this.state.project}
            projectDidSave={projectId => {
              // navigate to new project page
              this.props.history.push(
                '/workspace/projects/' +
                  encodeURIComponent(projectId) +
                  '/details'
              );
            }}
            user={this.props.user}
            api={this.props.api}
          />
        ) : (
          <h3 className="error">Project could not be found</h3>
        )}
      </div>
    );
  }
}

export default ProjectEdit;
