import { connect } from 'react-redux';
import Jre from './jre.component';

function mapStateToProps(state) {
  return {
    progressMaxValue: state.jre.downloadStats.length,
    progressCurrentValue: state.jre.downloadStats.downloaded
  };
}

function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Jre);
