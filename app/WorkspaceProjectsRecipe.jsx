import ProjectAPI from './api/ProjectAPI';

import IDUtil from './util/IDUtil';

//bookmark related view
import ProjectAnnotationView from './components/workspace/projects/annotation/ProjectAnnotationView';

//basic crud views
import ProjectListView from './components/workspace/projects/crud/ProjectListView';
import ProjectCreateView from './components/workspace/projects/crud/ProjectCreateView';
import ProjectDetailsView from './components/workspace/projects/crud/ProjectDetailsView';
import ProjectEditView from './components/workspace/projects/crud/ProjectEditView';

//session view
import ProjectSessionView from './components/workspace/projects/session/ProjectSessionView';

//queries view
import ProjectQueriesView from './components/workspace/projects/query/ProjectQueriesView';

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
    Switch,
    BrowserRouter as Router,
    Route,
    Link,
    Redirect
} from 'react-router-dom'

class WorkspaceProjects extends Component {
    constructor(props){
        super(props);

        this.state={}
    }

    getPropsRenderer(RenderComponent, props, extraProps={}){
        return (routeProps) => (
            <RenderComponent {...routeProps} {...props} {...extraProps} />
        )
    }

    render() {
        return(
            <Router>
                <Switch>
                    <Route exact path="/workspace/projects"
                        render={this.getPropsRenderer(ProjectListView, this.props, {api: ProjectAPI} )} />
                    <Route exact path="/workspace/projects/create"
                        render={this.getPropsRenderer(ProjectCreateView, this.props, {api: ProjectAPI} )} />

                    <Route exact path="/workspace/projects/:id" render={({ match }) => (
                        <Redirect to={`/workspace/projects/${match.params.id}/bookmarks`} />
                    )} />

                    <Route path="/workspace/projects/:id/bookmarks"
                        render={this.getPropsRenderer(ProjectAnnotationView, this.props, {api: ProjectAPI})} />
                    <Route path="/workspace/projects/:id/sessions"
                        render={this.getPropsRenderer(ProjectSessionView, this.props, {api: ProjectAPI})} />
                    <Route path="/workspace/projects/:id/queries"
                        render={this.getPropsRenderer(ProjectQueriesView, this.props, {api: ProjectAPI})} />
                    <Route path="/workspace/projects/:id/details"
                        render={this.getPropsRenderer(ProjectDetailsView, this.props, {api: ProjectAPI})} />
                    <Route path="/workspace/projects/:id/edit"
                        render={this.getPropsRenderer(ProjectEditView, this.props, {api: ProjectAPI})} />
                </Switch>
            </Router>
        );
    }
}

WorkspaceProjects.propTypes = {

    // project api
    api: PropTypes.shape({
        list: PropTypes.func.isRequired
    }),

    // current user object used for defining access roles per project
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired,
}

export default WorkspaceProjects;
