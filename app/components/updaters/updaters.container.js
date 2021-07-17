import { shell } from 'electron';
import { connect } from 'react-redux';
import Updaters from './updaters.component';

function mapStateToProps(state) {
  return {
    updaters: state.updaters
  };
}

function mapDispatchToProps() {
  return {
    onClickGithubLink: e => {
      e.preventDefault();
      shell.openExternal(e.target.href);
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Updaters);
