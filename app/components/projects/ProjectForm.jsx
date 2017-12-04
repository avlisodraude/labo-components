import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class ProjectForm extends React.Component {

  /**
   * Handle form submit
   */
  handleSubmit(e){
    e.preventDefault();

    let project = Object.assign({},this.props.project);
    project.name = this.name.value;
    project.description = this.description.value;
    project.isPrivate = this.isPrivate.checked;

    this.props.onSave(project);

    return false;
  }

  render(){
    return (
      <form className={IDUtil.cssClassName('project-form')} onSubmit={this.handleSubmit.bind(this)}>
        <div>
          <label className="label">Name</label>
          <input type="text" 
                 name="name" 
                 defaultValue={this.props.project.name} 
                 ref={(elem) => this.name=elem}
                 />
          
          <label className="label">Description</label>
          <textarea name="description" 
                    defaultValue={this.props.project.description} 
                    ref={(elem) => this.description=elem}
                    />

          <input type="checkbox" 
                 name="public" 
                 defaultChecked={!this.props.project.isPrivate} 
                 id="project-public"
                 ref={(elem) => this.isPrivate=elem}
                  />

           <label for="project-public">This is a public project that is visible for other users</label>
        </div>

        <div className="actions">
          <Link to={this.props.cancelLink} className="btn">Cancel</Link>
          <input type="submit" className="btn primary add" value={this.props.submitButton} />
        </div>
      </form>
    )
  }

}

ProjectForm.PropTypes = {
  'submitButton': PropTypes.string.isRequired,

  'cancelLink': PropTypes.string.isRequired,
  'successLink': PropTypes.string.isRequired,

  'project': PropTypes.shape({
      'name': PropTypes.string.isRequired,
      'description': PropTypes.string.isRequired,
      'private': PropTypes.bool.isRequired,
  }).isRequired,

  onSave: PropTypes.func.isRequired,
}

export default ProjectForm;