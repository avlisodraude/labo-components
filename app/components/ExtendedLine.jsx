import FlexModal from './FlexModal';

export default class LabelAsPoint extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal : false
        }
    }
    onClick (m){
        this.showModal('component')


        console.log('props', this.props)
        console.log(this.props.value, this.props.dataKey[this.props.index])
        alert('testing')
        // you can do anything with the key/payload
    }

    showModal(component, stateVariable) {
        const stateObj = {}
        // stateObj[stateVariable] = true
        this.setState({showModal: true});
    }

    render() {
        const { x, y } = this.props;

        //collection modal
        if(this.state.showModal) {
            const aggregationCreatorModal = (
                <FlexModal
                    elementId="field_select__modal"
                    stateVariable="showModal"
                    owner={this}
                    title="Create a new aggregation">

                </FlexModal>
            )
        }

        return (
            <circle
                className="sdasdsadasdsad"
                onClick={this.onClick.bind(this, x)}
                cx={x}
                cy={y}
                r={8}
                fill="transparent"/>
        );
    }
}
