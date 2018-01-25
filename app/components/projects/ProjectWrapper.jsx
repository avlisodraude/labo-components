import AnnotationStore from '../../flux/AnnotationStore';
import AnnotationUtil from '../../util/AnnotationUtil';
import IDUtil from '../../util/IDUtil';
import ProjectAPI from '../../api/ProjectAPI';
import ProjectForm from './ProjectForm';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

/**
 * Wrapper for pages within a single project. It provides a submenu that gives
 * access to all the subpages (Bookmarks/Sessions/Details)
 * It also provides the project data to the subviews.
 */
class ProjectWrapper extends React.PureComponent {
  /**
   * Construct this component
   */
  constructor(props) {
    super(props);

    // unique keys used for storage
    this.keys = {
      bookmarkCount: 'bg__project-bookmarks-count'
    };

    const bookmarkCount =
      window.sessionStorage.getItem(this.keys.bookmarkCount) || 0;

    this.state = {
      loading: true,
      project: null,
      bookmarkCount: bookmarkCount
    };
  }

  /**
   * React lifecycle event
   */
  componentDidMount() {
    this.loadProject();
  }

  /**
   * Load project from url id and load it to the state
   */
  loadProject() {
    const projectId = this.props.match.params.id;

    // load project data, and set state
    ProjectAPI.get(this.props.user.id, projectId, project => {
      if(project) {
        // inject project name to breadcrumbs
        const titles = {};
        titles[project.id] = project.name;
        // update breadcrumbs
        setBreadCrumbsFromMatch(this.props.match, titles);

        // set to state
        this.setState({
          loading: false,
          project
        });
        this.loadBookmarkCount(project);
      } else {
        this.setState({
          loading: false
        })
      }
    });
  }

  /**
   * Load bookmark count from annotation store
   *
   * @param {object} project Project to load bookmark count for
   */
  loadBookmarkCount(project) {
    AnnotationStore.getUserProjectAnnotations(
      this.props.user,
      project,
      this.setBookmarkCount.bind(this)
    );
  }

  /**
   * Set bookmark count to state
   *
   * @param {object} data Annotation data
   */
  setBookmarkCount(data) {
    const bookmarks = AnnotationUtil.generateBookmarkCentricList(
      data.annotations || []
    );
    const bookmarkCount = bookmarks ? bookmarks.length : 0;

    window.sessionStorage.setItem(this.keys.bookmarkCount, bookmarkCount);

    this.setState({
      bookmarkCount
    });
  }

  /**
   * React render function
   *
   * @return {Element}
   */
  render() {
    const RenderComponent = this.props.renderComponent;
    const project = this.state.project;
    return (
      <div className={IDUtil.cssClassName('project-wrapper')}>
        {this.state.loading ? (
          <h3 className="loading">Loading...</h3>
        ) : project ? (
          <div>
            <div className="project-header">
              <div className="info-bar">
                <h2>{project.name || 'Unnamed project'}</h2>
                <p>{project.description}</p>
              </div>

              <div className="submenu">
                <NavLink
                  activeClassName="active"
                  to={
                    '/workspace/projects/' +
                    encodeURIComponent(project.id) +
                    '/bookmarks'
                  }
                >
                  Bookmarks & Annotations<span className="count">
                    {this.state.bookmarkCount}
                  </span>
                </NavLink>
                <NavLink
                  activeClassName="active"
                  to={
                    '/workspace/projects/' +
                    encodeURIComponent(project.id) +
                    '/sessions'
                  }
                >
                  Tool Sessions<span className="count">
                    {project.sessions ? project.sessions.length : 0}
                  </span>
                </NavLink>
                <NavLink
                  activeClassName="active"
                  to={
                    '/workspace/projects/' +
                    encodeURIComponent(project.id) +
                    '/details'
                  }
                >
                  Details
                </NavLink>
              </div>
            </div>

            <div class="component">
              <RenderComponent {...this.props} project={this.state.project} />
            </div>
          </div>
        ) : (
          <h3 className="error">Project could not be found</h3>
        )}
      </div>
    );
  }
}

export default ProjectWrapper;
