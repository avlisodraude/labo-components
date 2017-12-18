// todo: enable when it is live
import IDUtil from '../../util/IDUtil';
import ProjectTable from './ProjectTable';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { setBreadCrumbsFromMatch } from '../helpers/BreadCrumbs';

class ProjectsOverview extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    setBreadCrumbsFromMatch(this.props.match);
  }

  render() {
    return (
      <div className={IDUtil.cssClassName('projects-overview')}>
        <div className="info-bar">
          <Link to="/workspace/projects/create" className="btn primary add">
            Create User Project
          </Link>
          <h2>User Projects</h2>
          <p>Store and share Bookmarks & Annotations and Tool Sessions</p>
        </div>

        <ProjectTable api={this.props.api} user={this.props.user} />
      </div>
    );
  }
}

ProjectsOverview.propTypes = {
  // project api
  api: PropTypes.shape({
    list: PropTypes.func.isRequired
  }),

  // current user object used for defining access roles per project
  user: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired
};

export default ProjectsOverview;
