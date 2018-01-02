import IDUtil from '../../util/IDUtil';
import ProjectAPI from '../../api/ProjectAPI';
import PropTypes from 'prop-types';
import { PowerSelect } from 'react-power-select';

/**
 * Select a project from a list and send it to the output callback
 */
class ProjectSelector extends React.Component {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);
    this.state = {
      activeProject: '',
      projectList: []
    };
    this.CLASS_PREFIX = 'prjs';
  }

  /**
   * React lifecycle event
   */
  componentDidMount() {
    //load the projects
    ProjectAPI.list(this.props.user.id, null, projects => {
      this.setState({ projectList: projects || [] });
    });
  }

  /**
   * Extract project from event and select it
   *
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */
  selectProject(event) {
    if (event && event.option && event.option.index) {
      this.onOutput(this.getProjectFromList(event.option.index));
    }
  }

  /**
   * Get project from the projectList, by given project id
   * @param  {string} projectId Id of project
   * @return {object}           Project
   */
  getProjectFromList(projectId) {
    const filtered = this.state.projectList.filter(p => p.id == projectId);
    return filtered.length > 0 ? filtered[0] : null;
  }

  /**
   * Call onOutput event
   *
   * @param {object} project Project that should be send to output
   */
  onOutput(project) {
    if (this.props.onOutput) {
      if (project) {
        setTimeout(
          () => {
            this.props.onOutput(this.constructor.name, project);
          },
          120 //ugly as sh*t, but the powerselect tries to call one more function after this
        );
      } else {
        console.debug('No project selected...');
      }
    }
  }

  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    let projectSelector = null;

    if (this.state.projectList.length > 0) {
      //the project selection part
      const options = this.state.projectList.map((project, index) => {
        return {
          key: project.id,
          title: project.name,
          index: project.id //what is this for again?
        };
      });

      if (options.length > 0) {
        projectSelector = (
          <div className="row">
            <div className="col-md-12">
              <form className="form-horizontal">
                <label className="col-sm-2">Project</label>
                <div className="col-sm-10">
                  <PowerSelect
                    key="project_powerselect"
                    options={options}
                    selected={this.state.activeProject.id}
                    searchIndices={['title']}
                    onChange={this.selectProject.bind(this)}
                    optionLabelPath="title"
                    placeholder="-- Select a project -- "
                  />
                </div>
              </form>
            </div>
          </div>
        );
      } else {
        projectSelector = <h3>You have not created any projects so far</h3>;
      }
    } else {
      projectSelector = <h3>Loading project list...</h3>;
    }

    //always return everything wrapped in an identifyable div
    return (
      <div className={IDUtil.cssClassName('project-selector')}>
        {projectSelector}
      </div>
    );
  }
}

ProjectSelector.propTypes = {
  user: PropTypes.object.isRequired,
  onOutput: PropTypes.func.isRequired
};

export default ProjectSelector;
