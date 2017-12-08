import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';

import AnnotationStore from '../../flux/AnnotationStore';
import AnnotationUtil from '../../util/AnnotationUtil';

import AnnotationRow from './AnnotationRow';
import { exportDataAsJSON } from '../helpers/Export';
import ItemDetailsRecipe from '../../ItemDetailsRecipe';

import BookmarkTable from './BookmarkTable';

class AnnotationView extends React.PureComponent {

  constructor(props) {
    super(props);
    
    this.state = {
      annotations: [],  
      selection: [],    
      loading : true,
      viewObject: null,
    }

    // bind functions
    this.viewAnnotation = this.viewAnnotation.bind(this);
    this.deleteAnnotation = this.deleteAnnotation.bind(this);

    this.filterAnnotations = this.filterAnnotations.bind(this);
    this.sortAnnotations = this.sortAnnotations.bind(this);
    this.renderResults = this.renderResults.bind(this);

    this.selectAllChange = this.selectAllChange.bind(this);
    this.selectAnnotation = this.selectAnnotation.bind(this);
  }

  componentWillMount() {
    this.loadAnnotations();
  }

  /**
   * Load Annotation from Store
   */
  loadAnnotations() {
    AnnotationStore.getUserProjectAnnotations(
      this.props.user,
      this.props.project,
      this.onLoadAnnotations.bind(this)
    )
  }

  /**
   * Annotation load callback: set data to state
   * @param  {Object} data Response object with annotation list
   */
  onLoadAnnotations(data) {
    
    const annotations = AnnotationUtil.nestedAnnotationListToAnnotationList(
      data.annotations || []
    )

    this.setState({
      annotations: annotations,
      loading : false,
      selection: [],
    });
  }
 
  /**
   * Filter annotation list by given filter
   * @param  {array} annotations  Annotations array
   * @param  {object} filter    Filter object
   * @return {array}            Filtered annotations array
   */
  filterAnnotations(annotations, filter){
    
    // filter on keywords in title, dataset or type
    if (filter.keywords){
      let keywords = filter.keywords.split(" ");
      keywords.forEach((k)=>{
        k = k.toLowerCase();
        annotations = annotations.filter((annotation)=>(annotation.text && annotation.text.toLowerCase().includes(k)
                                                  || (annotation.vocabulary && annotation.vocabulary.toLowerCase().includes(k))
                                                  || (annotation.label && annotation.label.toLowerCase().includes(k))
                                                  || (annotation.template && annotation.template.toLowerCase().includes(k))

                                                  // search the properties of a metadata annotation; both key/value fields
                                                  || (annotation.properties && annotation.properties.some((property)=>( (property.key && property.key.toLowerCase().includes(k)) || (property.value && property.value.toLowerCase().includes(k)))) )
        ));
      });
    }

    // filter on type
    if (filter.type){
      annotations = annotations.filter((annotation)=>(annotation.annotationType.toLowerCase().includes(filter.type)));
    }

    return annotations;
  }

  /** 
   * Sort annotations 
   * @param {Array} annotations List of annotations to be sorted
   * @param {string} sort Sort field
   * @return {Array} Sorted annotations 
   */
  sortAnnotations(annotations, field){
   let sorted = annotations;
   switch(field){
    case 'created':
      sorted.sort((a,b) => (a.created > b.created));
    break;    
    default:
      // no sorting,just return
      return sorted;
   }

   return sorted;

  }


  /**
   * Delete annotation
   * @param {Object} annotation Annotation to be removed
   */
  deleteAnnotation(annotation){
    alert('Todo: Implement delete');
  }


  /**
   * View annotation
   * @param {Object} annotation Annotation to be viewed
   */
  viewAnnotation(annotation){
    this.setState({
      viewObject: annotation
    })
  }

  /**
   * Sort change
   * @param {string} sort Sort name
   */
  sortChange(e){
    this.setSort(e.target.value);
  }


  /**
   * Select all items
   */
  selectAllChange(items, e){
    if (e.target.checked){
      let newSelection = this.state.selection.slice();
      items.forEach((item)=>{ if(!newSelection.includes(item)){ newSelection.push(item)}});
      // set
      this.setState({
        selection: newSelection
      });  
    } else{
      // unset
      this.setState({
        selection: this.state.selection.filter((item)=>(!items.includes(item)))
      });  
    }
    
  }

  /**
   * Select annotation   
   */
  selectAnnotation(annotation, select){ 
    if (select){  

      if(!this.state.selection.includes(annotation)){
        // add to selection
        this.setState({
          selection: [...this.state.selection, annotation]
        });
      }
      return;
    }

    // remove from selection
    if (!select){
      this.setState({
        selection: this.state.selection.filter((selected)=>(selected!== annotation))
      });
    }
  }

  /**
   * Renders the results in the AnnotationTable component
   * @param {object} state State of the render component
   */
  renderResultType(type, items){
    return(
      <div className="type-list">
        <h3>
          <input type="checkbox" 
                 checked={items.length > 0 && items.every((item)=>(this.state.selection.includes(item))) }
                 onChange={this.selectAllChange.bind(this, items)}
                />
          {type}: <span className="count">{items.length || 0}</span>
        </h3>
        <div className="table">          
            {items.map((annotation, index)=>(
            <AnnotationRow key={index} 
                         annotation={annotation} 
                         onDelete={this.deleteAnnotation}
                         onView={this.viewAnnotation}
                         selected={this.state.selection.includes(annotation)}
                         onSelect={this.selectAnnotation}                         
                         />
            ))}           
        </div> 
      </div>
    );
  }

  /**
   * Renders the results in the AnnotationTable component
   * @param {object} state State of the render component
   * @return {Element} View results
   */
  renderResults(renderState){
    return (
      <div>
        <h2>
          <input type="checkbox" 
                 checked={renderState.visibleItems.length > 0 && renderState.visibleItems.every((item)=>(this.state.selection.includes(item))) }
                 onChange={this.selectAllChange.bind(this, renderState.visibleItems)}
                />
          Annotations: <span className="count">{renderState.visibleItems.length || 0}</span>
        </h2>
        <div className="table">          
            {['classification','comment','link','metadata'].map((type) => (
                this.renderResultType(type, renderState.visibleItems.filter((item)=>(item.annotationType == type )))
              )) }
        </div> 
      </div>
      );
  }

  render(){
    return (
      <div className={IDUtil.cssClassName('annotation-view')}>
        <BookmarkTable 
          items={this.state.annotations}
          sortItems={this.sortAnnotations}
          orders={[
              {value:"created", name:"Annotation created"},
            ]}
          filterItems={this.filterAnnotations}
          filters={[
            {value: "classification", name: "Classification"},
            {value: "comment", name: "Comment"},
            {value: "link", name: "Link"},
            {value: "metadata", name: "Metadata"},
            ]}          
          renderResults={this.renderResults}
          onExport={exportDataAsJSON}
          />

        {this.state.viewObject ? 
        /* todo: display item details recipe in overlay */
        <div className="modal">
          <div className="close" onClick={()=>{this.viewAnnotation(null);}} />
          <div className="container">
              
            Todo: viewObjectsRecipe here: this requires the ID and Collection ID from the object (or rather a single unique ID)<br/><br/>
            {"<ItemDetailsRecipe id=\"\" cid=\"\" />"} 
            
            {/* 

            Params from url: id=5180841@program&cid=nisv-catalogue-aggr
            <itemDetailsRecipe id={this.state.viewObject.object.id} cid="nisv-catalogue-aggr" />

            */}
            
            <br/><br/>
          </div>
        </div>
        : null
      }
  </div>
  )
  }
}

export default AnnotationView;