//always use the IDUtil to generate class names, so styling components becomes less of a hazard
//see _components.scss on how using this utility turns out
import IDUtil from './util/IDUtil';

//when using icons, please consult this utility for the most common ones
import IconUtil from './util/IconUtil';

/*
	This is an example recipe to get you started on building your own recipe
	TODO add a props list to describe recommended props for this component
*/
class ExampleRecipe extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			//try to limit the number if state variables if possible.
			//In actual components try to avoid them altogether, since we aim to make reusable 'pure' components
		}
		this.CLASS_PREFIX = 'rcp__ex'
	}

	//Used for initialising listeners or obtaining data (asynchronously) for your recipe
	componentDidMount() {

	}

	//Try to avoid using this one. Sometimes it is needed, but it usually ain't pretty
	componentDidUpdate() {

	}

	//This function is what it's all about and renders your HTML within an element on the page you're calling this from
	//See index.jsx for how the cookRecipe() handles things. If you want this recipe to be hooked up to the cookRecipe function
	//map it there using a unique ID
	render() {
			return (
				/* Make sure to use the IDUtil for generating class names for your components/recipes
					(remember: a recipe is always the top-level component)

					If your recipe has a certain sub-section (in respect to styling), use the/a CLASS_PREFiX
					that reflects/abrreviates the main element's class name
				*/
				<div className={IDUtil.cssClassName('example-recipe')}>

					<div className={IDUtil.cssClassName('some-sub-section', this.CLASS_PREFIX)}>

					</div>
				</div>
			)
		}
	}

}

export default ExampleRecipe;